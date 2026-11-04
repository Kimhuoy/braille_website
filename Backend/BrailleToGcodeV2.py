import argparse
import sys
import os

feedRate_default = 6000
paperWidth_default = 210
paperHeight_default = 297
machine_offset_left = 13
machine_offset_right = 16
machine_offset_bottom = 3

def is_valid_braille(text):
    return all(0x2800 <= ord(char) <= 0x28FF or char in (" ", "\t", "\n") for char in text)

def clean_braille_text(text):
    lines = []
    for line in text.splitlines():
        cleaned_line = ""
        for char in line:
            if 0x2800 <= ord(char) <= 0x28FF or char in (' ', '\t'):
                cleaned_line += char
            # else:
            #     raise ValueError(f"Invalid character '{char}' detected in word: {line}")
        if cleaned_line or line.strip() == '':
            lines.append(cleaned_line)
    return lines

def get_unique_filename(filename):
    if not os.path.exists(filename):
        return filename
    base, ext = os.path.splitext(filename)
    counter = 1
    while True:
        new_filename = f"{base}({counter}){ext}"
        if not os.path.exists(new_filename):
            return new_filename
        counter += 1

def braille_to_gcode(braille_lines, filename="khmer_braille.gcode", Paper_width=paperWidth_default, Paper_height=paperHeight_default, feedrate=feedRate_default):
    if not braille_lines:
        raise ValueError("Braille input is empty")
    
    # for char in braille_lines:
    #     if not is_valid_braille(char):
    #         raise ValueError("Invalid characters detected (must be U+2800–U+28FF)")
        
    # Check if input contains only spaces, tabs, or empty lines
    # has_braille = any(any(0x2800 <= ord(char) <= 0x28FF for char in line) for line in braille_lines)
    # if not has_braille:
    #     raise ValueError("Braille input is empty")

    # Dimensional parameters (mm) from Technical Document B1
    a = 2.5   # horizontal distance between centres of adjacent dots
    b = 2.5   # vertical distance between centres of adjacent dots
    c = 6.0 + 0.5   # distance between centres of dots in contiguous cells (X step)
    d = 10.0 + 1.0  # distance between centres of dots in adjacent lines (Y step)
    e = 1.5   # diameter of base of dot
    # f = 0.2 -> 0.5mm  recommended dot height
    s = 1.0   # space between bases of two dots
    space_width = c  # Space character width 6 mm, one cell
    tab_width = 2 * c  # Tab character width 12 mm, two cells

    # Margins (mm)
    margin_top = 10.0
    margin_bottom = 30.0
    margin_left = 5.0 
    margin_right = 5.0 

    chars_per_line = (Paper_width - (margin_left + machine_offset_left) - (margin_right + machine_offset_right)) // c
    lines_per_page = (Paper_height - margin_top - margin_bottom - machine_offset_bottom) // d

    if chars_per_line <= 0 or lines_per_page <= 0:
        raise ValueError("Paper dimensions too small for Braille layout")

    cell_width = 2 * e + s
    cell_height = 3 * e + 2 * s

    dot_positions = {
        1: (0, 0),
        2: (0, b),
        3: (0, 2*b),
        4: (a, 0),
        5: (a, b),
        6: (a, 2*b)
    }

    # Initialize G-code
    gcode = [
        "; G-code for Khmer Braille",
        "; This G-code uses Braille 6-dots standard",
        f"; Paper dimensions: {Paper_width} mm width, {Paper_height} mm height",
        f"; Margins: {margin_top} mm top, {margin_bottom} mm bottom, {margin_left + machine_offset_left} mm left, {margin_right + machine_offset_right} mm right",
        f"; Layout: up to {chars_per_line} characters per line, {lines_per_page} lines per page",
        "; For braille text dimensions we follow this guideline",
        "; https://www.once.es/servicios-sociales/braille/comision-braille-espanola/",
        "; documentos-tecnicos/technical-documents/b-1-braille-dimensional-parameters-v2/",
        "; @@download/file/B%201%20Braille%20dimensional%20parameters%20V2%202024-08-09.pdf",
        " ",
        "G28 X Y          ; Home X and Y axes",
        "G90              ; Absolute positioning",
        f"G1 X{margin_left} Y{margin_top} F{feedrate}    ; Move to start with {margin_left}/{margin_top} mm left/top margins ({feedrate} mm/min)",
        "; Start Page 1"
    ]

    # Position counters
    x_base = margin_left
    y_base = margin_top
    char_count = 0
    line_count = 0
    page_count = 1

    def next_line(reason):
        nonlocal x_base, y_base, char_count, line_count
        x_base = margin_left
        y_base += d
        char_count = 0
        line_count += 1
        gcode.append(f"G1 X{margin_left} Y{y_base:.2f}  ; Newline ({reason})")

    def turn_page_if_full():
        # Only when something still has to go on the next sheet: a document that
        # ends exactly at the bottom of a page must not ask for a blank sheet.
        nonlocal x_base, y_base, line_count, page_count
        if line_count < lines_per_page:
            return
        gcode.append("M3 S0            ; Release")
        gcode.append(f"G1 X{margin_left} Y{Paper_height}  ; End of page")
        gcode.append("M0        ; Pause for paper change")
        line_count = 0
        y_base = margin_top
        x_base = margin_left
        page_count += 1
        gcode.append(f"; Start Page {page_count}")
        gcode.append("G28 X Y          ; Home X and Y axes")
        gcode.append(f"G1 X{margin_left} Y{y_base:.2f} F{feedrate}  ; Move to start of new page")

    # Blank cells at the end of a line emboss nothing; blank lines at the end feed paper for nothing
    lines = [line.rstrip(" \t\u2800") for line in braille_lines]
    while lines and not lines[-1]:
        lines.pop()

    for line in lines:
        turn_page_if_full()
        if not line:  # Empty line (newline)
            next_line("empty")
            continue

        char_count = 0  # Reset char_count for each line
        for char in line:
            # Wrap before a cell that does not fit, so a line that exactly fills
            # the width is not followed by an extra blank line
            if char_count >= chars_per_line or x_base + c > Paper_width - margin_right:
                next_line("due to line width")
                turn_page_if_full()
            if char == " ":
                x_base += space_width
            elif char == "\t":
                x_base += tab_width
            else:
                # Process Braille character
                unicode_val = ord(char) - 0x2800
                dots = [i+1 for i in range(6) if (unicode_val >> i) & 1]
                for dot in dots:
                    x, y = dot_positions[dot]
                    gcode.append(f"G1 X{x_base+x:.2f} Y{y_base+y:.2f}")
                    gcode.append("M3 S255            ; Emboss dot")
                    gcode.append("M3 S0            ; Release")

                x_base += c
            char_count += 1

        next_line("end of input line")

    gcode.append("; Return to initial state")
    gcode.append("G28 X            ; Home X axis")
    gcode.append(f"G1 Y{Paper_height}          ; Release Paper")
    gcode.append("M5               ; Ensure electromagnet is off")
    gcode.append("M84              ; Disable stepper motors")

    unique_filename = get_unique_filename(filename)
    try:
        with open(unique_filename, "w", encoding="utf-8") as f:
            f.write("\n".join(gcode))
        print(f"G-code saved to {unique_filename} with {page_count} page(s)")
    except IOError as e:
        raise IOError(f"Failed to write G-code file: {e}")
    
    total_chars = sum(len(line) for line in braille_lines)
    print(f"Processed {total_chars} characters across {page_count} page(s).")

def main():
    parser = argparse.ArgumentParser(description="Convert Braille to G-code for Khmer Braille embosser.")
    parser.add_argument("input", help="Braille or file path (.txt) containing Braille")
    parser.add_argument("--output", default="khmer_braille.gcode", help="Output G-code file")
    parser.add_argument("--file", action="store_true", help="Treat input as a .txt file path")
    parser.add_argument("--paper-width", type=float, default=paperWidth_default, help=f"Paper width in mm (default: {paperWidth_default})")
    parser.add_argument("--paper-height", type=float, default=paperHeight_default, help=f"Paper height in mm (default: {paperHeight_default})")
    parser.add_argument("--feedrate", type=int, default=feedRate_default, help=f"Feedrate in mm/min (default: {feedRate_default})")
    args = parser.parse_args()

    try:
        if args.file:
            ext = os.path.splitext(args.input)[1].lower()
            if ext == ".txt":
                try:
                    with open(args.input, "r", encoding="utf-8") as f:
                        text = f.read()
                        braille_lines = clean_braille_text(text)
                except UnicodeDecodeError:
                    print("Error: Input file must be UTF-8 encoded")
                    sys.exit(1)
            else:
                print(f"Error: Unsupported file extension {ext}. Use .txt")
                sys.exit(1)
        else:
            braille_lines = clean_braille_text(args.input)

        braille_to_gcode(braille_lines, args.output, args.paper_width, args.paper_height, args.feedrate)
    except FileNotFoundError:
        print(f"Error: Input file '{args.input}' not found")
        sys.exit(1)
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except IOError as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()