import { Icon } from "@iconify/react";
import appStore from "../../store/app";

const text = {
  km: {
    title: "ទម្រង់នេះមិនទាន់បើកនៅឡើយទេ",
    body: "យើងកំពុងរៀបចំវានៅឡើយ ដូច្នេះមិនទាន់អាចផ្ញើអ្វីនៅទីនេះបានទេ។ ដើម្បីទាក់ទងយើងឥឡូវនេះ សូមប្រើព័ត៌មានទំនាក់ទំនងនៅផ្នែកខាងក្រោមនៃទំព័រនេះ។",
  },
  en: {
    title: "This form is not open yet",
    body: "We are still setting it up, so nothing can be sent here for now. To reach us now, please use the contact details at the bottom of this page.",
  },
};

// Shown on the Feedback and Contribute pages until config/forms.js has an address to send to.
const FormsClosedNotice = () => {
  const { interfaceLang } = appStore();
  const t = text[interfaceLang] || text.km;
  return (
    <div role="status" className="mt-6 flex gap-3 bg-yellow-50 border border-yellow-400 rounded-xl p-4">
      <Icon icon="mdi:information-outline" className="text-2xl text-BlueDark shrink-0" aria-hidden="true" />
      <div>
        <p className="font-bold text-BlueDark">{t.title}</p>
        <p className="text-gray-700 mt-1">{t.body}</p>
      </div>
    </div>
  );
};

export default FormsClosedNotice;
