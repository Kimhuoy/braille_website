import { Icon } from "@iconify/react";
import appStore from "../../store/app";
import printerMachine from "../../assets/printer-machine.png";
import sdInsert from "../../assets/printer-sd-insert.png";
import lcdHome from "../../assets/printer-lcd-home.png";
import lcdMenu from "../../assets/printer-lcd-menu.png";
import lcdFileList from "../../assets/printer-lcd-filelist.png";
import startButton from "../../assets/printer-start-button.png";

// A single stage card used in the 3-stage workflow overview
const StageCard = ({ step, icon, place, title, description }) => (
  <div className="flex-1 bg-white rounded-xl shadow-md border p-5 relative">
    <div className="absolute -top-4 -left-4 bg-BlueDark text-white w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-md">
      {step}
    </div>
    <div className="flex items-center gap-3 mb-2">
      <Icon icon={icon} className="text-3xl text-BlueDark" />
      <span className="text-xs md:text-sm font-bold text-gray-400 uppercase">
        {place}
      </span>
    </div>
    <h3 className="font-bold text-sm md:text-base mb-1">{title}</h3>
    <p className="text-sm md:text-base text-gray-600">{description}</p>
  </div>
);

// A labelled image block re-used throughout the step-by-step section
const StepImage = ({ src, alt, caption }) => (
  <div className="w-full md:w-[45%] mx-auto md:mx-0 p-2 border border-black/20 rounded-lg shadow-sm bg-white">
    <img src={src} alt={alt} className="w-full h-auto rounded" />
    {caption && (
      <p className="text-center text-xs md:text-sm text-gray-500 mt-2">
        {caption}
      </p>
    )}
  </div>
);

const stageIcons = ["icons8:document", "tabler:file-code", "mdi:printer-3d-nozzle"];

// Page content per interface language.
const content = {
  km: {
    title: "ការប្រើប្រាស់ម៉ាស៊ីនបោះពុម្ពអក្សរប្រៃយ៍ (Braille Printer Machine)",
    subtitle:
      "ផ្នែកនេះបង្ហាញពីរបៀបនាំយកអត្ថបទដែលបានបកប្រែពីគេហទំព័រ ទៅបោះពុម្ពជាក្រដាសអក្សរប្រៃយ៍ (Braille) នៅលើម៉ាស៊ីនបោះពុម្ពជាក់ស្តែង ។",
    machineAlt: "ម៉ាស៊ីនបោះពុម្ពអក្សរប្រៃយ៍",
    overviewTitle: "ទិដ្ឋភាពទូទៅ៖ ជំហានទាំង ៣ នៃការបោះពុម្ព",
    stages: [
      {
        place: "នៅលើគេហទំព័រ",
        title: "អត្ថបទខ្មែរ → អក្សរប្រៃយ៍",
        description: "វាយ ឬបញ្ចូលឯកសារអត្ថបទភាសាខ្មែរ រួចប្រព័ន្ធនឹងបកប្រែជាអក្សរប្រៃយ៍ជូនស្វ័យប្រវត្តិ ។",
      },
      {
        place: "នៅលើគេហទំព័រ",
        title: "អក្សរប្រៃយ៍ → G-code",
        description: "ទាញយកឯកសារអក្សរប្រៃយ៍ រួចប្រើឧបករណ៍បំប្លែងឯកសារនោះទៅជាឯកសារ G-code ។",
      },
      {
        place: "នៅលើម៉ាស៊ីន",
        title: "G-code → បោះពុម្ព",
        description: "ចម្លងឯកសារ G-code ចូលកាត SD ដាក់ចូលម៉ាស៊ីន រួចចាប់ផ្តើមបោះពុម្ពលើក្រដាស ។",
      },
    ],
    materialsTitle: "សម្ភារៈដែលត្រូវការ",
    materials: [
      "កុំព្យូទ័រដែលមានអ៊ីនធឺណិត សម្រាប់បកប្រែ និងបង្កើតឯកសារ G-code ។",
      "កាត SD (ដែលភ្ជាប់មកជាមួយម៉ាស៊ីនអក្សរប្រៃយ៍) សម្រាប់ផ្ទេរឯកសារ ។",
      "ក្រដាសអក្សរប្រៃយ៍ (ក្រាស់សមស្របសម្រាប់ចាក់ពុម្ពអក្សរស្នាម) — សូមពិនិត្យជាមួយគ្រូជំនាញអក្សរប្រៃយ៍ ប្រសិនបើមិនប្រាកដថាត្រូវប្រើក្រដាសមួយណា ។",
      "ម៉ាស៊ីនអក្សរប្រៃយ៍ដែលបានដោតបញ្ចូលភ្លើង និងបើកបំពេញរួចរាល់ ។",
    ],
    stepsTitle: "ជំហានលម្អិត៖ ការបោះពុម្ពនៅលើម៉ាស៊ីន",
    sdAlt: "ការដោតកាត SD ចូលម៉ាស៊ីន",
    sdCaption: "ដោតកាត SD ចូលក្នុងរន្ធកាត SD នៅជ្រុងម៉ាស៊ីន",
    sdSteps: [
      "ដោតកាត SD ដែលមានទំហំ 1.5 cm ចូលកុំព្យូទ័រ ។",
      "ចម្លងឯកសារ G-code ចូលទៅក្នុងកាត SD ។",
      "ដកកាត SD ចេញពីកុំព្យូទ័រ រួចយកទៅដោតចូលរន្ធកាត SD ត្រឹមអក្សរប្រៃយ៍នៅជ្រុងម៉ាស៊ីន ។",
      "ដាក់ក្រដាសអក្សរប្រៃយ៍ចូលក្នុងម៉ាស៊ីន ។",
    ],
    lcdHomeLabel: "អេក្រង់ដើម (Home screen)",
    lcdMenuLabel: "អេក្រង់ម៉ឺនុយ (Menu screen)",
    menuSteps: [
      "នៅពេលបើកភ្លើងម៉ាស៊ីន អេក្រង់ LCD នឹងភ្លឺឡើង និងបង្ហាញទំព័រដើម (Home screen) ។",
      "ចុចប៊ូតុងបញ្ជាក់ (ចុចសង្កត់ចុះក្រោមលើប៊ូតុងវិល) ម្តងដើម្បីចូលទៅកាន់ទំព័រម៉ឺនុយ (Menu screen) ។",
      "បង្វិលប៊ូតុងវិល ៤ ក្លីក (clicks) ទៅខាងស្តាំ ដើម្បីរំលេចជម្រើស « Print from SD » (របៀបបោះពុម្ព) ។",
    ],
    fileListAlt: "ជម្រើសឯកសារ G-code នៅលើអេក្រង់",
    fileListCaption: "រំលេចជ្រើសរើសឯកសារ G-code",
    startAlt: "ប៊ូតុងចាប់ផ្តើមបោះពុម្ព",
    startCaption: "ប៊ូតុងចាប់ផ្តើម (Start)",
    printSteps: [
      "អេក្រង់នឹងបង្ហាញបញ្ជីឯកសារ G-code ទាំងអស់ដែលរកឃើញនៅក្នុងកាត SD ។ បង្វិលប៊ូតុងវិលដើម្បីរំលេចលើឯកសារដែលចង់បោះពុម្ព រួចចុចប៊ូតុងបញ្ជាក់ដើម្បីជ្រើសរើសវា ។",
      "ចុចប៊ូតុងចាប់ផ្តើម (ប៊ូតុងមូលនៅផ្នែកខាងក្រោមម៉ាស៊ីន) ដើម្បីចាប់ផ្តើមបោះពុម្ព ។",
      "ម៉ាស៊ីននឹងបោះពុម្ពទំព័រនោះ ។ សូមរង់ចាំរហូតដល់វាបោះពុម្ពចប់ សិនទើបដកក្រដាសចេញ ។",
    ],
    controlsTitle: "ការស្គាល់ប៊ូតុងលើអេក្រង់ LCD",
    resetTitle: "ប៊ូតុង Reset (ចំកណ្តាល)",
    resetDesc:
      "ចុចវាពេលណាក៏បាន ដើម្បីត្រឡប់ទៅកាន់ទំព័រដើម (Home screen) វិញភ្លាមៗ ។ បើវង្វេងក្នុងម៉ឺនុយ សូមចុចប៊ូតុងនេះ រួចចាប់ផ្តើមធ្វើម្តងទៀត ។",
    knobTitle: "ប៊ូតុងវិល / បញ្ជាក់ (ខាងស្តាំ)",
    knobDesc:
      "វិលវាទៅឆ្វេង/ស្តាំ ដើម្បីផ្លាស់ប្តូរម៉ឺនុយ ឬរំលេចជម្រើស រួចចុចសង្កត់ចុះក្រោមលើប៊ូតុងតែមួយនេះ ដើម្បីបញ្ជាក់ (Confirm) លើការជ្រើសរើស ។",
    controlsTip:
      "គន្លឹះ៖ ប៊ូតុងទាំងពីរនេះស្ថិតនៅជួរជាមួយគ្នាក្រោមអេក្រង់ LCD — Reset នៅចំកណ្តាល និងប៊ូតុងវិល/បញ្ជាក់នៅខាងស្តាំ ។",
    recapTitle: "សេចក្តីសង្ខេបរហ័ស",
    recap: [
      "បញ្ចូល/វាយអត្ថបទខ្មែរ លើគេហទំព័រ រួចទាញយកឯកសារអក្សរប្រៃយ៍ ។",
      "បំប្លែងឯកសារអក្សរប្រៃយ៍នោះទៅជា G-code រួចទាញយកមកកុំព្យូទ័រ ។",
      "ចម្លងឯកសារ G-code ចូលកាត SD រួចដោតកាតចូលម៉ាស៊ីន ។",
      "ដាក់ក្រដាស ជ្រើសរើសឯកសារលើអេក្រង់ LCD រួចចុចប៊ូតុងចាប់ផ្តើម ។",
    ],
  },
  en: {
    title: "Using the Braille Printer Machine",
    subtitle:
      "This section shows how to take text translated on the website and print it on Braille paper with the physical printer.",
    machineAlt: "Braille printer machine",
    overviewTitle: "Overview: the 3 stages of printing",
    stages: [
      {
        place: "On the website",
        title: "Khmer text → Braille",
        description: "Type or upload a Khmer text file, and the system translates it to Braille automatically.",
      },
      {
        place: "On the website",
        title: "Braille → G-code",
        description: "Download the Braille file, then use the converter to turn it into a G-code file.",
      },
      {
        place: "On the machine",
        title: "G-code → Print",
        description: "Copy the G-code file onto the SD card, insert it into the machine, and start printing on paper.",
      },
    ],
    materialsTitle: "What you need",
    materials: [
      "A computer with internet access, to translate and create the G-code file.",
      "The SD card (supplied with the Braille machine), to transfer the file.",
      "Braille paper (thick enough to emboss) — check with a Braille teacher if you are not sure which paper to use.",
      "The Braille machine, plugged in and switched on.",
    ],
    stepsTitle: "Step by step: printing on the machine",
    sdAlt: "Inserting the SD card into the machine",
    sdCaption: "Insert the SD card into the SD card slot on the side of the machine",
    sdSteps: [
      "Insert the 1.5 cm SD card into your computer.",
      "Copy the G-code file onto the SD card.",
      "Remove the SD card from the computer and insert it into the SD card slot on the side of the machine.",
      "Load the Braille paper into the machine.",
    ],
    lcdHomeLabel: "Home screen",
    lcdMenuLabel: "Menu screen",
    menuSteps: [
      "When the machine is switched on, the LCD screen lights up and shows the Home screen.",
      "Press the confirm button (push down on the rotary knob) once to open the Menu screen.",
      "Turn the rotary knob 4 clicks to the right to highlight the « Print from SD » option.",
    ],
    fileListAlt: "G-code file selection on the screen",
    fileListCaption: "Highlight and select the G-code file",
    startAlt: "Print start button",
    startCaption: "Start button",
    printSteps: [
      "The screen lists every G-code file found on the SD card. Turn the knob to highlight the file you want to print, then press the confirm button to select it.",
      "Press the start button (the round button at the bottom of the machine) to start printing.",
      "The machine prints the page. Wait until it has finished before removing the paper.",
    ],
    controlsTitle: "Getting to know the LCD buttons",
    resetTitle: "Reset button (middle)",
    resetDesc:
      "Press it at any time to return straight to the Home screen. If you get lost in the menu, press this button and start again.",
    knobTitle: "Rotary knob / confirm (right)",
    knobDesc:
      "Turn it left/right to move through the menu or highlight an option, then push down on the same knob to confirm your choice.",
    controlsTip:
      "Tip: both buttons sit in one row below the LCD screen — Reset in the middle and the rotary knob/confirm on the right.",
    recapTitle: "Quick recap",
    recap: [
      "Enter or type Khmer text on the website, then download the Braille file.",
      "Convert the Braille file to G-code and download it to your computer.",
      "Copy the G-code file onto the SD card and insert the card into the machine.",
      "Load the paper, select the file on the LCD screen, and press the start button.",
    ],
  },
};

const PrinterGuide = () => {
  const { interfaceLang } = appStore();
  const c = content[interfaceLang] || content.km;

  return (
    <div className="lg:mt-24 mt-20 max-w-[100%]">
      {/* Header */}
      <div className="flex flex-col items-center text-center px-4">
        <h1 className="font-bold lg:text-2xl text-base md:text-xl">{c.title}</h1>
        <p className="text-gray-500 text-sm md:text-base mt-2 max-w-3xl">
          {c.subtitle}
        </p>
      </div>

      {/* Hero image of the machine */}
      <div className="flex justify-center mt-8">
        <div className="p-3 border border-black/20 rounded-xl shadow-md bg-white">
          <img
            src={printerMachine}
            alt={c.machineAlt}
            className="lg:w-[320px] md:w-[280px] w-[220px] h-auto"
          />
        </div>
      </div>

      {/* 3-stage workflow overview */}
      <div className="lg:mx-24 md:mx-14 mx-6 mt-10">
        <h2 className="font-bold text-sm md:text-base lg:text-lg mb-4">
          {c.overviewTitle}
        </h2>
        <div className="flex flex-col md:flex-row gap-8 md:gap-4 mt-6">
          {c.stages.map((stage, i) => (
            <StageCard key={i} step={i + 1} icon={stageIcons[i]} {...stage} />
          ))}
        </div>
      </div>

      {/* Materials needed */}
      <div className="lg:mx-24 md:mx-14 mx-6 mt-12">
        <h2 className="font-bold text-sm md:text-base lg:text-lg mb-4">
          {c.materialsTitle}
        </h2>
        <ul className="custom-numbered-list text-sm md:text-base">
          {c.materials.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Step-by-step: printing on the machine */}
      <div className="lg:mx-24 md:mx-14 mx-6 mt-12">
        <h2 className="font-bold text-sm md:text-base lg:text-lg mb-6">
          {c.stepsTitle}
        </h2>

        {/* Step: insert SD */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-10">
          <StepImage src={sdInsert} alt={c.sdAlt} caption={c.sdCaption} />
          <ol className="custom-numbered-list text-sm md:text-base flex-1">
            {c.sdSteps.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>

        {/* Step: LCD home + menu */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-10">
          <div className="flex gap-4 flex-1 justify-center flex-wrap">
            <StepImage src={lcdHome} alt={c.lcdHomeLabel} caption={c.lcdHomeLabel} />
            <StepImage src={lcdMenu} alt={c.lcdMenuLabel} caption={c.lcdMenuLabel} />
          </div>
          <ol className="custom-numbered-list text-sm md:text-base flex-1" start={5}>
            {c.menuSteps.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>

        {/* Step: select file + start */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-10">
          <div className="flex gap-4 flex-1 justify-center flex-wrap">
            <StepImage src={lcdFileList} alt={c.fileListAlt} caption={c.fileListCaption} />
            <StepImage src={startButton} alt={c.startAlt} caption={c.startCaption} />
          </div>
          <ol className="custom-numbered-list text-sm md:text-base flex-1" start={8}>
            {c.printSteps.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Control panel reference */}
      <div className="lg:mx-24 md:mx-14 mx-6 mt-4">
        <h2 className="font-bold text-sm md:text-base lg:text-lg mb-4">
          {c.controlsTitle}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Icon icon="mdi:restart" className="text-xl text-BlueDark" />
              <span className="font-bold text-sm md:text-base">{c.resetTitle}</span>
            </div>
            <p className="text-sm md:text-base text-gray-600">{c.resetDesc}</p>
          </div>
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Icon
                icon="mdi:gesture-tap-button"
                className="text-xl text-BlueDark"
              />
              <span className="font-bold text-sm md:text-base">{c.knobTitle}</span>
            </div>
            <p className="text-sm md:text-base text-gray-600">{c.knobDesc}</p>
          </div>
        </div>
        <p className="text-xs md:text-sm text-gray-400 mt-3">{c.controlsTip}</p>
      </div>

      {/* Quick recap */}
      <div className="lg:mx-24 md:mx-14 mx-6 mt-12">
        <h2 className="font-bold text-sm md:text-base lg:text-lg mb-4 text-red-500">
          {c.recapTitle}
        </h2>
        <ol className="custom-numbered-list text-sm md:text-base">
          {c.recap.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default PrinterGuide;
