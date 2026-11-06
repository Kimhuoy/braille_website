
// Shared by the Contribute and Feedback forms.
export const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-BlueDark";

export const Field = ({ label, required, children }) => (
  <label className="block">
    <span className="block text-sm font-bold text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </span>
    {children}
  </label>
);
