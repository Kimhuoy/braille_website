import React from "react";
import { Link } from "react-router-dom";
import appStore from "../../store/app";
// Screenshots of the website, taken at double resolution so they stay sharp.
import guidelineHeader from "../../assets/guideline-header.webp";
import guidelineControls from "../../assets/guideline-controls.webp";
import guidelineStep1Input from "../../assets/guideline-step1-input.webp";
import guidelineUpload from "../../assets/guideline-upload.webp";
import guidelineStep1Symbols from "../../assets/guideline-step1-symbols.webp";
import guidelineStep2Status from "../../assets/guideline-step2-status.webp";
import guidelineStep3Result from "../../assets/guideline-step3-result.webp";
import guidelineReading from "../../assets/guideline-reading.webp";
import guidelineHeaderEn from "../../assets/guideline-header-en.webp";
import guidelineControlsEn from "../../assets/guideline-controls-en.webp";
import guidelineStep1InputEn from "../../assets/guideline-step1-input-en.webp";
import guidelineUploadEn from "../../assets/guideline-upload-en.webp";
import guidelineStep1SymbolsEn from "../../assets/guideline-step1-symbols-en.webp";
import guidelineStep2StatusEn from "../../assets/guideline-step2-status-en.webp";
import guidelineStep3ResultEn from "../../assets/guideline-step3-result-en.webp";
import guidelineReadingEn from "../../assets/guideline-reading-en.webp";
import guidelineListen from "../../assets/guideline-listen.webp";
import guidelineListenEn from "../../assets/guideline-listen-en.webp";
import guidelineUploadBraille from "../../assets/guideline-upload-braille.webp";
import guidelineUploadBrailleEn from "../../assets/guideline-upload-braille-en.webp";

const GuideSection = ({ id, number, title, image, imageAlt, extraImage, extraImageAlt, zoomHint, narrow, children }) => (
  <section id={id} className="mt-12 lg:mx-16 md:mx-10 mx-5 scroll-mt-24">
    <h2 className="flex items-center gap-3 font-bold text-BlueDark text-lg md:text-xl mb-4">
      {number && (
        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-BlueDark text-white text-sm shrink-0">
          {number}
        </span>
      )}
      {title}
    </h2>
    {image && (
      <figure className={`mx-auto mb-5 ${narrow ? "max-w-xl" : "max-w-4xl"}`}>
        <a href={image} target="_blank" rel="noopener noreferrer" className="block p-2 border border-gray-200 rounded-lg bg-white shadow-sm hover:border-BlueDark">
          <img src={image} alt={imageAlt} className="w-full h-auto rounded" loading="lazy" />
        </a>
        <figcaption className="text-sm text-gray-500 text-center mt-1">{zoomHint}</figcaption>
      </figure>
    )}
    <div className="custom-numbered-list text-base md:text-lg space-y-2">
      {children}
    </div>
    {extraImage && (
      <figure className="mx-auto mt-5 max-w-xl">
        <a href={extraImage} target="_blank" rel="noopener noreferrer" className="block p-2 border border-gray-200 rounded-lg bg-white shadow-sm hover:border-BlueDark">
          <img src={extraImage} alt={extraImageAlt} className="w-full h-auto rounded" loading="lazy" />
        </a>
        <figcaption className="text-sm text-gray-500 text-center mt-1">{zoomHint}</figcaption>
      </figure>
    )}
  </section>
);

// Page content per interface language. Contains JSX (bold, code, kbd),
// so it lives here rather than in i18n.js.
const content = {
  km: {
    title: "ទំព័រណែនាំការប្រើប្រាស់ ប្រព័ន្ធបកប្រែអក្សរប្រៃខ្មែរដោយម៉ាស៊ីន",
    subtitle: "ទំព័រនេះពន្យល់ពីរបៀបប្រើប្រាស់មុខងារនីមួយៗនៃគេហទំព័រ ជាជំហានៗ។",
    toc: "មាតិកា",
    zoomHint: "ចុចលើរូបភាព ដើម្បីមើលទំហំធំ",
    quick: {
      title: "ចាប់ផ្តើមរហ័ស",
      items: [
        <>ជ្រើស <strong>ទិសដៅ</strong> (អត្ថបទ → អក្សរប្រៃ ឬ អក្សរប្រៃ → អត្ថបទ) និង <strong>ប្រភេទអក្សរប្រៃ</strong> (ខ្មែរ ឬអង់គ្លេស) នៅខាងលើទំព័រដើម។</>,
        <>វាយ បិទភ្ជាប់ ឬផ្ទុកឯកសារក្នុង <strong>ជំហានទី ១</strong>។ ការបកប្រែកើតឡើងដោយស្វ័យប្រវត្តិ។</>,
        <>ក្នុង <strong>ជំហានទី ៣</strong> កែសម្រួល ចម្លង ឬទាញយកលទ្ធផល (រួមទាំង G-code សម្រាប់ម៉ាស៊ីនបោះពុម្ព)។ លទ្ធផលអង់គ្លេសអាច<strong>ស្តាប់ជាសំឡេង</strong>បាន។</>,
      ],
    },
    header: {
      title: "ក្បាលទំព័រ ម៉ឺនុយ និងភាសាចំណុចប្រទាក់",
      imageAlt: "ក្បាលទំព័រគេហទំព័រ បង្ហាញម៉ឺនុយ និងប៊ូតុងប្តូរភាសា",
      items: [
        <><strong>ទំព័រដើម</strong> — ត្រឡប់ទៅកាន់ទំព័របកប្រែសំខាន់។</>,
        <><strong>បញ្ចេញមតិ</strong> — បើកទម្រង់សម្រាប់ផ្ញើមតិយោបល់អំពីគេហទំព័រ។</>,
        <><strong>ជំនួយ</strong> — ទំព័រណែនាំនេះ។</>,
        <><strong>ម៉ាស៊ីនបោះពុម្ព</strong> — របៀបប្រើប្រាស់ម៉ាស៊ីនបោះពុម្ពអក្សរប្រៃ។</>,
        <><strong>ចូលរួមចែករំលែក</strong> — ផ្ញើអត្ថបទខ្មែរ (តួអក្សរ សញ្ញា ពាក្យ ឬប្រយោគ) និងអក្សរប្រៃរបស់វា ឬឯកសារគំរូ។</>,
        <><strong>អំពីយើង</strong> — ប្រភពដើម និងក្រុមអ្នកបង្កើតគេហទំព័រ។</>,
        <>
          ប៊ូតុង <strong>EN / ខ្មែរ</strong> នៅជ្រុងស្តាំ ប្តូរតែភាសានៃបញ្ចុះបញ្ចូល
          (ម៉ឺនុយ ស្លាក ប៊ូតុង) ប៉ុណ្ណោះ — វា{" "}
          <strong>មិនប៉ះពាល់</strong> ដល់អត្ថបទដែលអ្នកកំពុងបកប្រែទេ។
        </>,
      ],
    },
    step1: {
      title: "ជំហានទី ១ — បញ្ចូលអត្ថបទ ឬអក្សរប្រៃ",
      imageAlt: "ប្រអប់បញ្ចូលអក្សរខ្មែរ ជាមួយចំនួនតួអក្សរ និងប៊ូតុងផ្ទុកឯកសារ",
      items: [
        <>វាយ ឬបិទភ្ជាប់អត្ថបទដែលអ្នកចង់បកប្រែក្នុងប្រអប់។ ការបកប្រែកើតឡើងដោយស្វ័យប្រវត្តិពេលអ្នកវាយ។</>,
        <>ចំនួនតួអក្សរដែលបានបញ្ចូលបង្ហាញនៅខាងក្រោមប្រអប់ ដើម្បីងាយតាមដាន។</>,
        <>
          ប៊ូតុង <strong>✕</strong> នៅជ្រុងប្រអប់
          លេចឡើងនៅពេលមានអក្សរ ប្រើសម្រាប់លុបអត្ថបទទាំងអស់ភ្លាមៗ។
        </>,
        <>
          ក្នុងទិសដៅ <strong>អក្សរប្រៃ → អត្ថបទ</strong> ប្រអប់នេះទទួលអក្សរប្រៃ។ ពេល{" "}
          <strong>"ក្តារចុចប្រៃ"</strong> ត្រូវបានធីក គ្រាប់ចុចនីមួយៗក្លាយជាក្រឡាប្រៃមួយ
          (ឧ. <code>,g</code> → ⠠⠛)។ ដោះធីកវា ដើម្បីបិទភ្ជាប់ចំណុចអក្សរប្រៃ។
        </>,
        <>
          ប្រសិនបើអត្ថបទនៅក្នុងឯកសារ ចុច <strong>"ជ្រើសរើសឯកសារដើម្បីផ្ទុក"</strong> — មើលផ្នែក{" "}
          <a href="#upload" className="text-BlueDark underline">ផ្ទុកឯកសារ</a> ខាងក្រោម។
        </>,
      ],
    },
    equation: {
      title: "សញ្ញា",
      imageAlt: "ផ្ទាំងសញ្ញា មាន ឧបករណ៍ និមិត្តសញ្ញា និងរចនាសម្ព័ន្ធ",
      items: [
        <>
          ចុច <strong>"សញ្ញា"</strong> ខាងលើប្រអប់បញ្ចូល។
          ផ្ទាំងនេះមានបីក្រុម៖{" "}
          <strong>ឧបករណ៍</strong> <strong>និមិត្តសញ្ញា</strong> និង{" "}
          <strong>រចនាសម្ព័ន្ធ</strong>។
        </>,
        <>
          <strong>សមីការថ្មី</strong> បញ្ចូលប្រអប់សមីការ <code>⟦ ⟧</code>{" "}
          ត្រង់ទីតាំងទស្សន៍ទ្រនិច។ អ្វីៗដែលនៅចន្លោះ <code>⟦ ⟧</code>{" "}
          ត្រូវបានបកប្រែតាមច្បាប់គណិតវិទ្យាប្រៃ (ប្រភាគ និទស្សន្ត ឫស ...)
          ដូចក្នុងសៀវភៅណែនាំ PDF។
        </>,
        <>
          <strong>និមិត្តសញ្ញា</strong>៖ ចុចលើសញ្ញាណាមួយដើម្បីបញ្ចូលវាត្រង់ទស្សន៍ទ្រនិច។
          ចុចសញ្ញាព្រួញ ▾ ដើម្បីមើលសញ្ញាទាំងអស់តាមប្រភេទ (អក្សរក្រិច ព្រួញ ធរណីមាត្រ ...)
          និងស្វែងរក។ សញ្ញាដែលមាន<strong>ចំណុចពណ៌ទឹកក្រូច</strong>
          មិនទាន់មានកូដប្រៃក្នុងវចនានុក្រមនៅឡើយ — ពេលប្រើ គេហទំព័រនឹងប្រាប់អ្នក
          ជំនួសការលុបវាដោយស្ងាត់ៗ។
        </>,
        <>
          <strong>រចនាសម្ព័ន្ធ</strong>៖ ប្រភាគ និទស្សន្ត/សន្ទស្សន៍ ឫស អាំងតេក្រាល
          ផលបូក (∑) វង់ក្រចក អនុគមន៍ សញ្ញាលើ (បន្ទាត់លើ វ៉ិចទ័រ) លីមីត និង log
          ប្រមាណវិធី និងម៉ាទ្រីស។ ចុចលើគំរូណាមួយ វានឹងបញ្ចូលទម្រង់ដែលមានប្រអប់ទទេ{" "}
          <code>⬚</code> ដើម្បីបំពេញ។
        </>,
        <>
          វាយលេខ ឬអក្សរ ដើម្បីជំនួសប្រអប់ <code>⬚</code> ដែលកំពុងជ្រើស
          រួចចុច <kbd>Tab</kbd> ដើម្បីទៅប្រអប់បន្ទាប់ (ឬ <kbd>Shift</kbd>+<kbd>Tab</kbd>{" "}
          ត្រឡប់ក្រោយ)។ ប្រសិនបើអ្នកជ្រើសអត្ថបទមុនពេលចុចគំរូ អត្ថបទនោះនឹងចូលទៅក្នុងប្រអប់ទីមួយ។
        </>,
        <>
          អ្នកក៏អាចវាយសមីការដោយខ្លួនឯងផងដែរ ក្នុងទម្រង់នេះ៖{" "}
          <code>⟦x^2⟧</code> (និទស្សន្ត) <code>⟦x_1⟧</code> (សន្ទស្សន៍){" "}
          <code>⟦(x+1)/(x-1)⟧</code> (ប្រភាគ) <code>⟦√(x)⟧</code> (ឫស)។
        </>,
        <>
          <strong>គីមីវិទ្យា</strong>៖ ផ្ទាំង "គីមីវិទ្យា" មានព្រួញប្រតិកម្ម (→ ⇌ ភាយ ↑ កករ ↓)
          សម្ព័ន្ធ (— ═ ☰) និងរចនាសម្ព័ន្ធ៖ រូបមន្ត អ៊ីយ៉ុង អ៊ីសូតូប ប្រតិកម្មមានលក្ខខណ្ឌលើព្រួញ
          (ឧ. ដុតកំដៅ) ភាព (g) (l) (s) (aq) ចំនួនអុកស៊ីតកម្ម ថ្មអគ្គិសនី
          និងសញ្ញាវ៉ាឡង់ Ⅰ Ⅱ Ⅲ (<code>_#1</code> <code>_#2</code> <code>_#3</code>)។
          រូបមន្តគីមីអាចវាយជាអត្ថបទធម្មតាបាន៖ H2O, H₂SO₄, NH4Cl, Cu²⁺ —
          គេហទំព័រស្គាល់វា ហើយសរសេរលេខក្រោយធាតុជាសន្ទស្សន៍ (លេខនៅខាងក្រោម)
          ដូចក្នុងសៀវភៅណែនាំ៖ <code>,h2,o</code>។ ប៊ូតុងគីមីបញ្ចូលរូបមន្តជាមួយលេខនៅខាងក្រោម (H₂O)។
          ធាតុតែមួយជាមួយលេខ (ឧ. B12) ត្រូវបានទុកជាអត្ថបទធម្មតា — ប្រសិនបើវាជារូបមន្ត
          សូមដាក់វានៅក្នុង <code>⟦ ⟧</code>។
        </>,
        <>
          <strong>ទំរង់ឡឺវីស និងរូបមន្តគ្រោង</strong>៖ ប្រើ "ទំរង់ឡឺវីសនៃអាតូម" និង
          "គំនូសម៉ូលេគុល" ក្នុងផ្ទាំងគីមីវិទ្យា រួចប្តូរអក្សរ។ គំនូសគឺជាសមីការដែលសរសេរលើច្រើនបន្ទាត់៖
          បន្ទាត់នីមួយៗក្លាយជាបន្ទាត់ប្រៃមួយ ហើយអ្វីដែលនៅជួរឈរដូចគ្នា ក៏នៅជួរឈរដូចគ្នាក្នុងអក្សរប្រៃដែរ។
          ដូច្នេះ សូមដាក់អាតូម ចំនុច ឬសម្ព័ន្ធនីមួយៗ ឲ្យចំពីក្រោមអ្វីដែលនៅខាងលើវា (រាប់តួអក្សរ)។
          ដកឃ្លាមួយ = ក្រឡាទទេមួយ។ សញ្ញា៖ <code>◦</code> ចំនុចអេឡិចត្រុង{" "}
          <code>|</code> គំនូសតាងឆ្វេង ស្តាំ ឬសម្ព័ន្ធលើ ក្រោម{" "}
          <code>—</code> គំនូសតាងលើ ក្រោម (ឬសម្ព័ន្ធរវាងអាតូម){" "}
          <code>∷</code> <code>⋮⋮</code> ចំនុចពីរជាន់ បីជាន់{" "}
          <code>⋰</code> <code>⋱</code> ចំនុចបញ្ឆិត <code>/</code> <code>\</code> គំនូសបញ្ឆិត
          និង <code>⏟</code> នៅបន្ទាត់ចុងក្រោយ = សញ្ញាម៉ូលេគុល។
          កូដទាំងនេះតាមតារាងទំព័រ ៤៤-៤៥ នៃសៀវភៅណែនាំ។
        </>,
        <>
          <strong>ជីវវិទ្យា</strong>៖ ផ្ទាំង "ជីវវិទ្យា" មានសញ្ញា ♂ (ប្រុស) ♀ (ស្រី) × (ការបង្កាត់) និង ↓
          ព្រមទាំងរចនាសម្ព័ន្ធ៖ ការបង្កាត់ ឧ. <code>⟦Aa × Aa ↓ AA 2Aa aa⟧</code> —
          ចន្លោះរវាងហ្សែននីមួយៗត្រូវបានរក្សាទុកក្នុងអក្សរប្រៃ (<code>,aa @* ,aa $%33o ,a,a #2,aa aa</code>)។
          <strong>សញ្ញាប្រើសំរួល</strong> (អក្សរគូសឆូត) ដូចជា <s>a, b, c</s> — ប្រើរចនាសម្ព័ន្ធ
          "សញ្ញាប្រើសំរួល" ក្នុងផ្ទាំងជីវវិទ្យា — សរសេរជា <code>[a, b, c]</code>។ ពាក្យអក្សរធំទាំងមូល (VIP, ADN → <code>,,vip</code>{" "}
          <code>,,adn</code>) និងអក្សរកាត់ (P.M.H. → <code>,p4 ,m4 ,h4</code>) សរសេរជាអត្ថបទធម្មតា
          មិនចាំបាច់នៅក្នុង <code>⟦ ⟧</code> ទេ។
        </>,
      ],
    },
    step2: {
      title: "ជំហានទី ២ — ការបំប្លែងដោយស្វ័យប្រវត្តិ",
      imageAlt: "ប្រអប់បង្ហាញស្ថានភាពកំពុងបំប្លែង",
      items: [
        <>
          ជំហាននេះ <strong>មិនមានប៊ូតុងឱ្យចុចទេ</strong> — ការបកប្រែកើតឡើង
          ដោយស្វ័យប្រវត្តិភ្លាមៗ នៅពេលអ្នកវាយក្នុងជំហានទី ១។
        </>,
        <>
          ប្រអប់នេះគ្រាន់តែបង្ហាញស្ថានភាព៖ ពណ៌ប្រផេះ (មិនទាន់មានអត្ថបទ)
          ពណ៌ខៀវ (កំពុងបំប្លែង) ឬពណ៌បៃតង (✓ បានបំប្លែងរួចរាល់)។
        </>,
      ],
    },
    step3: {
      title: "ជំហានទី ៣ — លទ្ធផល៖ កែសម្រួល ចម្លង និងទាញយក",
      imageAlt: "ប្រអប់លទ្ធផល ជាមួយប៊ូតុងកែសម្រួល និងជម្រើសទាញយកបីបែប",
      items: [
        <>
          លទ្ធផលបកប្រែបង្ហាញក្នុងប្រអប់នេះ — តាមលំនាំដើមជា{" "}
          <strong>អានតែប៉ុណ្ណោះ</strong> ដើម្បីការពារកុំឱ្យកែច្រឡំ។
        </>,
        <>
          <strong>របៀបកែលទ្ធផលប្រៃ</strong> (ប្រសិនបើការបកប្រែមិនទាន់ត្រឹមត្រូវ)៖
          <ol className="mt-1 ml-6 space-y-1 [counter-reset:list-item-counter]">
            <li>
              ចុចប៊ូតុង <strong>"កែសម្រួល"</strong> នៅជ្រុងខាងស្តាំខាងលើនៃប្រអប់លទ្ធផល។
              ប្រអប់ប្តូរជាពណ៌ស ហើយអ្នកអាចវាយបាន។
            </li>
            <li>
              ចុចត្រង់កន្លែងដែលអ្នកចង់កែ ហើយលុបក្រឡាខុសដោយចុច <kbd>Backspace</kbd> ឬ{" "}
              <kbd>Delete</kbd>។
            </li>
            <li>
              វាយអក្សរប្រៃត្រឹមត្រូវ។ <strong>"ក្តារចុចប្រៃ (Braille ASCII)"</strong> ត្រូវបានធីកជាលំនាំដើម៖
              គ្រាប់ចុចនីមួយៗក្លាយជាក្រឡាប្រៃ ៦ ចំណុចមួយ (ឧ. វាយ <code>,g</code> បានជា ⠠⠛ និង{" "}
              <code>?1/2#</code> បានជា ⠹⠂⠌⠆⠼)។ តារាងគ្រាប់ចុចពេញលេញ មាននៅក្នុងផ្ទាំង
              "របៀបកែលទ្ធផលប្រៃ"។
            </li>
            <li>
              ដើម្បីបិទភ្ជាប់ចំណុចអក្សរប្រៃដែលបានចម្លងពីកន្លែងផ្សេង សូមដោះធីក "ក្តារចុចប្រៃ" ជាមុនសិន។
            </li>
            <li>
              ចុច <strong>"រួចរាល់"</strong> ពេលកែរួច រួចទាញយកឯកសារ។
              ការកែនៅលើគេហទំព័រនេះ មិនត្រូវការពុម្ពអក្សរបន្ថែមទេ។
            </li>
          </ol>
        </>,
        <>ប៊ូតុងរូបក្រដាសចម្លង នៅជ្រុងប្រអប់ ចម្លងលទ្ធផលទៅក្ដារតម្បៀតខ្ទាស់។</>,
        <>
          ខាងក្រោមប្រអប់លទ្ធផល មានជម្រើសទាញយក៖ ឯកសារអក្សរ (.txt)
          ឯកសារ Word (.docx) Braille ASCII (.brf) និងឯកសារ G-Code (.gcode)
          សម្រាប់ម៉ាស៊ីនបោះពុម្ពអក្សរប្រៃដោយផ្ទាល់។
        </>,
        <>
          <strong>នៅលើកុំព្យូទ័ររបស់អ្នក៖</strong> ឯកសារ .docx / .txt មានចំណុចអក្សរប្រៃ។
          ប្រសិនបើឃើញជាប្រអប់ទទេ សូមជ្រើសរើសទាំងអស់ (Ctrl+A) ហើយប្តូរពុម្ពអក្សរទៅ{" "}
          <strong>Segoe UI Symbol</strong> (Windows) ឬ Apple Braille (Mac) — ពុម្ពអក្សរទាំងនេះមានស្រាប់។
          ឯកសារ .brf បង្ហាញជាអក្សរ និងសញ្ញា ដូចជា <code>,g</code> — ដើម្បីឃើញជាចំណុច
          ហើយកែដោយវាយគ្រាប់ចុចដូចគ្នា សូមបើកវាក្នុង Word ជ្រើសរើសទាំងអស់ (Ctrl+A)
          ហើយប្តូរពុម្ពអក្សរទៅ <strong>SimBraille</strong> (ពុម្ពអក្សរនេះមកជាមួយកម្មវិធី
          Duxbury Braille Translator)។ ប្រសិនបើកុំព្យូទ័ររបស់អ្នកមិនមានវាទេ សូមកែនៅលើគេហទំព័រនេះ។
        </>,
      ],
    },
    direction: {
      title: "ជ្រើសទិសដៅ និងប្រភេទអក្សរប្រៃ",
      imageAlt: "ប៊ូតុងប្តូរទិសដៅ និងជម្រើសប្រភេទអក្សរប្រៃ (គូសរង្វង់ក្រហម)",
      items: [
        <>ប៊ូតុងរាងមូល <strong>ភាសាខ្មែរ ⇄ អក្សរប្រៃ</strong> ប្តូរទិសដៅបកប្រែ៖ ពីអត្ថបទទៅអក្សរប្រៃ ឬពីអក្សរប្រៃទៅអត្ថបទវិញ។ ចំណងជើងធំគឺឈ្មោះប្រព័ន្ធ <strong>ប្រព័ន្ធបកប្រែអក្សរប្រៃខ្មែរដោយម៉ាស៊ីន</strong> ហើយបន្ទាត់ខាងក្រោមវាប្រាប់ទិសដៅដែលកំពុងប្រើ (ឧ. បកប្រែភាសាខ្មែរទៅអក្សរប្រៃ)។</>,
        <><strong>ប្រភេទអក្សរប្រៃ</strong>៖ ជ្រើស <strong>អក្សរប្រៃខ្មែរ</strong> សម្រាប់អត្ថបទខ្មែរ (ពាក្យអង់គ្លេសនៅក្នុងអត្ថបទខ្មែរក៏ប្រើបាន) ឬ <strong>អក្សរប្រៃអង់គ្លេស (មិនកាត់)</strong> សម្រាប់អត្ថបទអង់គ្លេសសុទ្ធ — ច្បាប់ UEB មិនកាត់ គឺក្រឡាមួយសម្រាប់អក្សរមួយ ឧ. Hello → <code>,hello</code> (⠠⠓⠑⠇⠇⠕)។</>,
        <>ពេលជ្រើសអក្សរប្រៃអង់គ្លេស ស្លាក និងប្រអប់ទាំងអស់ប្តូរទៅជា «អង់គ្លេស» ហើយការបកប្រែត្រូវធ្វើម្តងទៀតដោយស្វ័យប្រវត្តិ។</>,
      ],
    },
    upload: {
      title: "ផ្ទុកឯកសារ",
      imageAlt: "ផ្ទាំងផ្ទុកឯកសារ ជាមួយប៊ូតុងជ្រើសរើសឯកសារ និងចំណាំ",
      items: [
        <>ក្នុងជំហានទី ១ ចុច <strong>"ជ្រើសរើសឯកសារដើម្បីផ្ទុក"</strong>។ ផ្ទាំងមួយលេចឡើងនៅកណ្តាលអេក្រង់។</>,
        <>ទម្លាក់ឯកសារលើប្រអប់ ឬចុច <strong>"ជ្រើសរើសឯកសារ"</strong>។ រង់ចាំបន្តិច — អត្ថបទចូលទៅក្នុងប្រអប់ ហើយត្រូវបានបកប្រែដោយស្វ័យប្រវត្តិ។ សូមពិនិត្យអត្ថបទម្តងទៀតជានិច្ច។</>,
        <><strong>អត្ថបទខ្មែរ ឬអង់គ្លេស</strong>៖ Word (.docx), .txt ឬ PDF។ PDF ដែលរក្សាទុកពី Word ត្រូវបានអានដោយផ្ទាល់ ប៉ុន្តែ PDF ស្កេនអាចមានកំហុស — ប្រើ Word ឬ .txt ប្រសិនបើអាច។ ឯកសារ Word ចាស់ (.doc) ត្រូវរក្សាទុកជា .docx ជាមុនសិន។</>,
        <><strong>ឯកសារអក្សរប្រៃ</strong> (ទិសដៅ អក្សរប្រៃ → អត្ថបទ)៖ ផ្ទាំងផ្ទុកឯកសារបង្ហាញរូបឯកសារ BRF, BRL និង PEF (មើលរូបភាពក្នុងផ្នែក <a href="#reading" className="text-BlueDark underline">អានអក្សរប្រៃ</a>)។ ឯកសារ <strong>.brf ត្រូវបានអានជាអក្សរប្រៃអង់គ្លេសតែប៉ុណ្ណោះ</strong> — ទំព័រប្តូរទៅ «អក្សរប្រៃអង់គ្លេស» ដោយស្វ័យប្រវត្តិ ហើយអ្នកអាចស្តាប់លទ្ធផលជាសំឡេងបាន (មើល <a href="#listen" className="text-BlueDark underline">ស្តាប់លទ្ធផល</a>)។ ឯកសារ .brl (Braille ASCII ពី Duxbury DBT ឬពីគេហទំព័រនេះ) .pef និង .txt/Word/PDF ដែលមានចំណុចអក្សរប្រៃ ឬអក្សរប្រៃដែលវាយដោយពុម្ពអក្សរ SimBraille ប្រើបានទាំងអក្សរប្រៃខ្មែរ និងអង់គ្លេស។ ឯកសារ Duxbury (.dxb) ត្រូវរក្សាទុកជា .brf ឬ .brl ក្នុង Duxbury ជាមុនសិន។</>,
        <><strong>ទំហំឯកសារ</strong>៖ ឯកសារមួយអាចធំរហូតដល់ <strong>២០ MB</strong> និងមានអត្ថបទប្រហែល <strong>២០០ ទំព័រ</strong> (៣០០ ០០០ តួអក្សរ — ទំព័រ A4 មួយនៃអក្សរខ្មែរ ១២pt មានប្រហែល ១ ៥០០ តួអក្សរ)។ ឯកសារ PDF អាចមានរហូតដល់ ២០០ ទំព័រ ប៉ុន្តែ PDF ស្កេនយ៉ាងច្រើន <strong>១០ ទំព័រ</strong> ព្រោះទំព័រនីមួយៗត្រូវអានជារូបភាព។ ឯកសារ ១០០ ទំព័របកប្រែក្នុងរយៈពេលពីរបីវិនាទី។ ប្រសិនបើឯកសាររបស់អ្នកធំជាងនេះ សូមបំបែកវាជាផ្នែកៗ។</>,
        <>ប្រសិនបើមានបញ្ហា ផ្ទាំងនឹងបង្ហាញសារពន្យល់ជាពណ៌ក្រហម (ឧ. ប្រភេទឯកសារមិនត្រឹមត្រូវ)។</>,
      ],
    },
    reading: {
      title: "អានអក្សរប្រៃ (អក្សរប្រៃ → ខ្មែរ ឬអង់គ្លេស)",
      imageAlt: "លទ្ធផលអក្សរប្រៃខ្មែរដែលមានពាក្យអង់គ្លេស និងប៊ូតុងប្តូរពាក្យ (គូសរង្វង់ក្រហម)",
      items: [
        <>ចុចប៊ូតុងរាងមូល ដើម្បីប្តូរទៅ <strong>អក្សរប្រៃ → អត្ថបទ</strong> ហើយជ្រើសប្រភេទអក្សរប្រៃ (ខ្មែរ ឬអង់គ្លេស)។</>,
        <>បញ្ចូលអក្សរប្រៃ៖ វាយដោយ <strong>ក្តារចុចប្រៃ</strong> (គ្រាប់ចុចនីមួយៗ = ក្រឡាប្រៃមួយ ឧ. <code>,g</code> → ⠠⠛) បិទភ្ជាប់ចំណុចអក្សរប្រៃ (ដោះធីកក្តារចុចប្រៃជាមុន) ឬចុច <strong>"ជ្រើសរើសឯកសារដើម្បីផ្ទុក"</strong> ដើម្បីផ្ទុកឯកសារអក្សរប្រៃ — ផ្ទាំងបង្ហាញរូបឯកសារ BRF, BRL, PEF (ឯកសារ .brf = អក្សរប្រៃអង់គ្លេស)។</>,
        <><strong>ពាក្យអង់គ្លេសក្នុងអក្សរប្រៃខ្មែរ</strong>៖ អក្សរអង់គ្លេស និងអក្សរខ្មែរប្រើក្រឡាប្រៃដូចគ្នា (⠛ = g = ក) ហើយគ្មានសញ្ញាសម្គាល់។ គេហទំព័រទាយពាក្យអង់គ្លេសដោយស្វ័យប្រវត្តិ (ពាក្យក្នុងវចនានុក្រមអង់គ្លេស និងពាក្យអក្សរធំ ដូចជា <code>,,vip</code>) ហើយបង្ហាញពួកវាក្នុងប្រអប់ <strong>"ពាក្យដែលអាចជាភាសាអង់គ្លេស"</strong> នៅក្រោមលទ្ធផល។</>,
        <>ពាក្យនីមួយៗបង្ហាញការអានទាំងពីរ (អង់គ្លេស ⇄ ខ្មែរ)។ ការអានដែលកំពុងប្រើជាអក្សរដិត។ <strong>ចុចលើពាក្យ</strong> ដើម្បីប្តូរ។ ពាក្យខ្លីៗដែលមានសញ្ញា <strong>?</strong> ត្រូវបានអានជាខ្មែរជាមុន — សូមពិនិត្យ ហើយចុចប្រសិនបើវាជាភាសាអង់គ្លេស។</>,
        <><strong>អក្សរប្រៃអង់គ្លេស</strong>៖ ច្បាប់ UEB មិនកាត់ — អក្សរធំ (<code>,</code> ឬ <code>,,</code>) លេខ (<code>#</code>) និងវណ្ណយុត្តិអង់គ្លេស។ អក្សរប្រៃអង់គ្លេសកាត់ (Grade 2) មិនទាន់ត្រូវបានគាំទ្រនៅឡើយទេ។</>,
      ],
      uploadAlt: "ផ្ទាំងផ្ទុកឯកសារអក្សរប្រៃ ជាមួយរូបឯកសារ BRF, BRL និង PEF",
    },
    listen: {
      title: "ស្តាប់លទ្ធផលជាសំឡេង (អង់គ្លេស)",
      imageAlt: "ផ្ទាំង «ស្តាប់លទ្ធផល» នៅក្រោមលទ្ធផលអង់គ្លេស ជាមួយប៊ូតុងស្តាប់ ឈប់ សំឡេង និងល្បឿន (គូសរង្វង់ក្រហម)",
      items: [
        <>ផ្ទាំង <strong>"ស្តាប់លទ្ធផល"</strong> លេចឡើងនៅក្រោមប្រអប់លទ្ធផល ពេលអ្នកបកប្រែ <strong>អក្សរប្រៃអង់គ្លេស → អង់គ្លេស</strong> (ឧ. បន្ទាប់ពីផ្ទុកឯកសារ .brf)។</>,
        <>ចុច <strong>"ស្តាប់"</strong> ដើម្បីចាប់ផ្តើម <strong>"ផ្អាក"</strong> ដើម្បីផ្អាក ហើយ <strong>"បន្ត"</strong> ដើម្បីស្តាប់បន្ត។ <strong>"ឈប់"</strong> បញ្ឈប់ ហើយពេលចុចស្តាប់ម្តងទៀត វាចាប់ផ្តើមពីដើម។</>,
        <><strong>សំឡេង</strong>៖ សំឡេងដែលធម្មជាតិជាងគេត្រូវបានជ្រើសដោយស្វ័យប្រវត្តិ។ អ្នកអាចជ្រើសសំឡេងផ្សេង ហើយគេហទំព័រចងចាំការជ្រើសរើសរបស់អ្នកនៅលើកុំព្យូទ័រនេះ។ ក្នុង <strong>Microsoft Edge</strong> សូមជ្រើសសំឡេងដែលមានពាក្យ «Natural» ហើយក្នុង <strong>Google Chrome</strong> សំឡេង «Google» — ពួកវាស្តាប់ទៅធម្មជាតិជាងគេ។</>,
        <><strong>ល្បឿន</strong>៖ ពី 0.75× (យឺត) ដល់ 1.5× (លឿន)។</>,
        <>សំឡេងមកពីកម្មវិធីរុករករបស់អ្នក ដោយ<strong>ឥតគិតថ្លៃ</strong> ហើយអត្ថបទមិនត្រូវបានរក្សាទុកនៅលើម៉ាស៊ីនមេរបស់យើងទេ។ <strong>សំឡេងខ្មែរមិនទាន់មាននៅឡើយ</strong> ដូច្នេះផ្ទាំងនេះបង្ហាញតែសម្រាប់លទ្ធផលអង់គ្លេសប៉ុណ្ណោះ។ ប្រសិនបើកម្មវិធីរុករករបស់អ្នកមិនអាចអានជាសំឡេងបាន សូមប្រើ Edge ឬ Chrome។</>,
      ],
    },
    more: {
      title: "មុខងារផ្សេងទៀត",
      items: [
        <><strong>ម៉ាស៊ីនបោះពុម្ព</strong>៖ ទាញយកឯកសារ G-Code (.gcode) ក្នុងជំហានទី ៣ ហើយមើលទំព័រ <Link to="/printer-guide" className="text-BlueDark underline">ម៉ាស៊ីនបោះពុម្ព</Link> សម្រាប់ជំហានបោះពុម្ពនៅលើម៉ាស៊ីន។</>,
        <><strong>ចូលរួមចែករំលែក</strong>៖ ស្ថាប័ន និងគ្រូបង្រៀនផ្ញើតែ<strong>អត្ថបទខ្មែរ</strong> (តួអក្សរ សញ្ញា ពាក្យ ឬប្រយោគ) <strong>និងអក្សរប្រៃរបស់វា</strong> ឬឯកសារគំរូ នៅទំព័រ <Link to="/contribute" className="text-BlueDark underline">ចូលរួមចែករំលែក</Link>។ ទំព័រនោះបង្ហាញគំរូទិន្នន័យពិត និងគំរូ CSV។ អ្នកមិនចាំបាច់កែវចនានុក្រមទេ — ក្រុមបច្ចេកទេសរបស់យើងពិនិត្យ និងធ្វើបច្ចុប្បន្នភាពប្រព័ន្ធ។</>,
        <><strong>បញ្ចេញមតិ</strong>៖ រាយការណ៍បញ្ហា ការបកប្រែខុស ឬគំនិតថ្មីនៅទំព័រ <Link to="/feedback" className="text-BlueDark underline">បញ្ចេញមតិ</Link>។</>,
      ],
    },
    notes: {
      title: "ចំណាំ៖",
      items: [
        <>
          រាល់ការសរសេរលេខក្នុងការបកប្រែ សូមធ្វើការដកឃ្លាខាងក្រោយលេខនោះ
          ចំនួនមួយដង ។
          <p className="mx-4 mt-1">ឧ. នៅក្នុងឆ្នាំ២០០៤ កុសលបានចាប់កំណើត (ត្រឹមត្រូវ) ។</p>
          <p className="text-red-500 mx-4">ឧ. នៅក្នុងឆ្នាំ២០០៤កុសលបានចាប់កំណើត (ខុស) ។</p>
        </>,
        <>
          រាល់ការសរសេរ « » ក្នុងការបកប្រែ សូមធ្វើការដកឃ្លាខាងក្រោយសញ្ញានោះ​ ។
          <p className="mx-4 mt-1">ឧ. « កុសលបានចាប់កំណើត​ » (ត្រឹមត្រូវ) ។</p>
          <p className="text-red-500 mx-4">ឧ. «កុសលបានចាប់កំណើត​» (ខុស) ។</p>
        </>,
        <>ការអានឯកសារ PDF មិនទាន់ល្អនៅឡើយ — សូមផ្ទុកឯកសារ Word (.docx) ឬ .txt ប្រសិនបើអាច ។</>,
        <>អ្នកអាចយក Mouse ទៅដាក់ពីលើប៊ូតុងនោះ​ ដើម្បីដឹងពីមុខងាររបស់វា ។</>,
      ],
    },
  },
  en: {
    title: "User Guide: Khmer Braille Machine Translation System",
    subtitle: "This page explains how to use each feature of the website, step by step.",
    toc: "Contents",
    zoomHint: "Click the picture to see it larger",
    quick: {
      title: "Quick start",
      items: [
        <>Choose the <strong>direction</strong> (text → Braille or Braille → text) and the <strong>Braille type</strong> (Khmer or English) at the top of the Home page.</>,
        <>Type, paste or upload a file in <strong>Step 1</strong>. It is translated automatically.</>,
        <>In <strong>Step 3</strong>, edit, copy or download the result (including G-code for the Braille printer). English results can also be <strong>read aloud</strong>.</>,
      ],
    },
    header: {
      title: "Header, menu and interface language",
      imageAlt: "The website header, showing the menu and the language switch button",
      items: [
        <><strong>Home</strong> — return to the main translation page.</>,
        <><strong>Feedback</strong> — open a form to send comments about the website.</>,
        <><strong>Help</strong> — this guide.</>,
        <><strong>Printer Guide</strong> — how to use the Braille printer machine.</>,
        <><strong>Contribute</strong> — send Khmer text (letters, signs, words or sentences) with its Braille, or sample documents.</>,
        <><strong>About Us</strong> — the background and the team behind the website.</>,
        <>
          The <strong>EN / ខ្មែរ</strong> button in the top-right corner only changes
          the interface language (menus, labels, buttons) — it{" "}
          <strong>does not affect</strong> the text you are translating.
        </>,
      ],
    },
    step1: {
      title: "Step 1 — Enter text or Braille",
      imageAlt: "The Khmer text input box, with the character count and the file upload button",
      items: [
        <>Type or paste the text you want to translate into the box. It is translated automatically as you type.</>,
        <>The number of characters entered is shown below the box so you can keep track.</>,
        <>
          The <strong>✕</strong> button in the corner of the box appears once there
          is text, and clears all of it at once.
        </>,
        <>
          In the <strong>Braille → text</strong> direction this box takes Braille. While{" "}
          <strong>"Braille keyboard"</strong> is ticked, each key becomes one Braille cell
          (e.g. <code>,g</code> → ⠠⠛). Untick it to paste Braille dots.
        </>,
        <>
          If your text is in a file, click <strong>"Choose file to upload"</strong> — see{" "}
          <a href="#upload" className="text-BlueDark underline">Upload a file</a> below.
        </>,
      ],
    },
    equation: {
      title: "Signs",
      imageAlt: "The Signs panel, with Tools, Symbols and Structures groups",
      items: [
        <>
          Click <strong>"Signs"</strong> above the input box.
          The panel has three groups:{" "}
          <strong>Tools</strong>, <strong>Symbols</strong> and{" "}
          <strong>Structures</strong>.
        </>,
        <>
          <strong>New equation</strong> inserts an equation box <code>⟦ ⟧</code>{" "}
          at the cursor. Everything between <code>⟦ ⟧</code> is translated with
          the Braille mathematics rules (fractions, exponents, roots ...), as in
          the PDF handbook.
        </>,
        <>
          <strong>Symbols</strong>: click any symbol to insert it at the cursor.
          Click the ▾ arrow to see every symbol by category (Greek letters, arrows,
          geometry ...) and to search. Symbols with an <strong>orange dot</strong>{" "}
          have no Braille code in the dictionary yet — if you use one, the website
          will tell you instead of silently dropping it.
        </>,
        <>
          <strong>Structures</strong>: fractions, exponents/subscripts, roots,
          integrals, sums (∑), brackets, functions, accents (overline, vector),
          limits and log, operators, and matrices. Click a template to insert a
          pattern with empty <code>⬚</code> boxes to fill in.
        </>,
        <>
          Type a number or letter to replace the selected <code>⬚</code> box, then
          press <kbd>Tab</kbd> to move to the next box (or <kbd>Shift</kbd>+<kbd>Tab</kbd>{" "}
          to go back). If you select text before clicking a template, that text is
          placed in the first box.
        </>,
        <>
          You can also type equations yourself, like this:{" "}
          <code>⟦x^2⟧</code> (exponent) <code>⟦x_1⟧</code> (subscript){" "}
          <code>⟦(x+1)/(x-1)⟧</code> (fraction) <code>⟦√(x)⟧</code> (root).
        </>,
        <>
          <strong>Chemistry</strong>: the "Chemistry" tab has reaction arrows
          (→ ⇌, gas ↑, precipitate ↓), bonds (— ═ ☰) and structures: formulas,
          ions, isotopes, reactions with conditions over the arrow (e.g. heating),
          states (g) (l) (s) (aq), oxidation numbers, electrochemical cells, and the
          valence signs Ⅰ Ⅱ Ⅲ (<code>_#1</code> <code>_#2</code> <code>_#3</code>).
          Chemical formulas can be typed as ordinary text: H2O, H₂SO₄, NH4Cl, Cu²⁺ —
          the website recognises them and writes the numbers after an element as
          subscripts (the low number cells), as in the handbook: <code>,h2,o</code>.
          The chemistry buttons insert formulas with the number at the bottom (H₂O).
          One element with a number (e.g. B12) is left as ordinary text — if it is a
          formula, put it inside <code>⟦ ⟧</code>.
        </>,
        <>
          <strong>Lewis structures and structural formulas</strong>: use "Lewis: atoms"
          and "Molecule drawings" in the Chemistry tab, then change the letters. A drawing
          is an equation written over several lines: each line becomes one Braille line,
          and things in the same column stay in the same Braille column. So put each atom,
          dot or bond exactly under the one above it (count the characters). One space
          gives one blank cell. Marks: <code>◦</code> electron dot,{" "}
          <code>|</code> bar beside an atom, or a bond above/below,{" "}
          <code>—</code> bar above/below an atom (or a bond between atoms),{" "}
          <code>∷</code> <code>⋮⋮</code> two or three pairs of dots,{" "}
          <code>⋰</code> <code>⋱</code> slanted dots, <code>/</code> <code>\</code> slanted
          lines, and <code>⏟</code> on the last line for the molecule brace. The codes
          follow the table on pages 44-45 of the handbook.
        </>,
        <>
          <strong>Biology</strong>: the "Biology" tab has ♂ (male), ♀ (female), × (cross) and ↓,
          and structures: a genetic cross such as <code>⟦Aa × Aa ↓ AA 2Aa aa⟧</code> — the spaces
          between genotypes are kept in Braille (<code>,aa @* ,aa $%33o ,a,a #2,aa aa</code>).
          <strong>Struck-out letters</strong> (simplification signs) such as <s>a, b, c</s> — use
          the "Struck out" structure in the Biology tab — are written <code>[a, b, c]</code>. Words in capitals
          (VIP, ADN → <code>,,vip</code> <code>,,adn</code>) and abbreviations
          (P.M.H. → <code>,p4 ,m4 ,h4</code>) are written as ordinary text, not inside{" "}
          <code>⟦ ⟧</code>.
        </>,
      ],
    },
    step2: {
      title: "Step 2 — Automatic conversion",
      imageAlt: "The box showing the conversion status",
      items: [
        <>
          This step <strong>has no button to click</strong> — the translation
          happens automatically, straight away, as you type in step 1.
        </>,
        <>
          The box only shows the status: grey (no text yet), blue (converting)
          or green (✓ converted).
        </>,
      ],
    },
    step3: {
      title: "Step 3 — Result: edit, copy and download",
      imageAlt: "The result box, with the Edit button and the download options",
      items: [
        <>
          The translation is shown in this box — by default it is{" "}
          <strong>read-only</strong> so it cannot be changed by mistake.
        </>,
        <>
          <strong>How to edit the Braille result</strong> (if the translation isn't quite right):
          <ol className="mt-1 ml-6 space-y-1 [counter-reset:list-item-counter]">
            <li>
              Click the <strong>"Edit"</strong> button at the top-right of the result box.
              The box turns white and you can type in it.
            </li>
            <li>
              Click where you want to change something, and delete wrong cells with{" "}
              <kbd>Backspace</kbd> or <kbd>Delete</kbd>.
            </li>
            <li>
              Type the correct Braille. <strong>"Braille keyboard (Braille ASCII)"</strong> is ticked
              by default: each key becomes one 6-dot cell (e.g. typing <code>,g</code> gives ⠠⠛ and{" "}
              <code>?1/2#</code> gives ⠹⠂⠌⠆⠼). The full key table is in the "How to edit the
              Braille result" panel.
            </li>
            <li>To paste Braille dots copied from somewhere else, untick "Braille keyboard" first.</li>
            <li>
              Click <strong>"Done"</strong> when you are finished, then download your file.
              Editing on this website needs no extra font.
            </li>
          </ol>
        </>,
        <>The copy button in the corner of the box copies the result to the clipboard.</>,
        <>
          Below the result box are the download options: text file (.txt),
          Word file (.docx), Braille ASCII (.brf) and G-Code file (.gcode) for
          printing directly on the Braille printer.
        </>,
        <>
          <strong>On your own computer:</strong> the .docx / .txt files contain Braille dots.
          If you see empty boxes, select all (Ctrl+A) and change the font to{" "}
          <strong>Segoe UI Symbol</strong> (Windows) or Apple Braille (Mac) — both come with the
          computer. The .brf file shows letters and signs such as <code>,g</code> — to see dots
          and edit by typing the same keys, open it in Word, select all (Ctrl+A) and change the
          font to <strong>SimBraille</strong> (it comes with the Duxbury Braille Translator).
          If your computer does not have it, edit on this website instead.
        </>,
      ],
    },
    direction: {
      title: "Choose the direction and the Braille type",
      imageAlt: "The direction button and the Braille type choice (circled in red)",
      items: [
        <>The round <strong>Khmer ⇄ Braille</strong> button switches the direction: from text to Braille, or from Braille back to text. The big title is the system name, <strong>Khmer Braille Machine Translation System</strong>; the line under it tells you which direction is in use (e.g. Translate Khmer to Braille).</>,
        <><strong>Braille type</strong>: choose <strong>Khmer Braille</strong> for Khmer text (English words inside Khmer text work too), or <strong>English Braille (uncontracted)</strong> for English-only text — UEB uncontracted, one cell per letter, e.g. Hello → <code>,hello</code> (⠠⠓⠑⠇⠇⠕).</>,
        <>With English Braille chosen, all labels and boxes say "English", and the text is translated again automatically.</>,
      ],
    },
    upload: {
      title: "Upload a file",
      imageAlt: "The upload window, with the choose-file button and notes",
      items: [
        <>In Step 1, click <strong>"Choose file to upload"</strong>. A window opens in the middle of the screen.</>,
        <>Drop the file on the box or click <strong>"Choose file"</strong>. Wait a moment — the text goes into the box and is translated automatically. Always check the text afterwards.</>,
        <><strong>Khmer or English text</strong>: Word (.docx), .txt or PDF. PDFs saved from Word are read directly, but scanned PDFs can have mistakes — use Word or .txt when you can. Old Word files (.doc) must be saved as .docx first.</>,
        <><strong>Braille files</strong> (Braille → text direction): the upload window shows BRF, BRL and PEF file icons (see the picture in <a href="#reading" className="text-BlueDark underline">Reading Braille</a>). <strong>.brf files are read as English Braille only</strong> — the page switches to "English Braille" by itself, and you can listen to the result (see <a href="#listen" className="text-BlueDark underline">Listen to the result</a>). .brl files (Braille ASCII from Duxbury DBT or this website), .pef, and .txt/Word/PDF with Braille dots or Braille typed in the SimBraille font work for both Khmer and English Braille. Duxbury files (.dxb) must be saved as .brf or .brl in Duxbury first.</>,
        <><strong>File size</strong>: one file can be up to <strong>20 MB</strong>, with about <strong>200 pages</strong> of text (300,000 characters — an A4 page of 12pt Khmer is about 1,500 characters). A PDF can have up to 200 pages, but a scanned PDF at most <strong>10 pages</strong>, because each page is read as a picture. A 100-page document is translated in a few seconds. If your document is bigger, split it into parts.</>,
        <>If something is wrong, the window shows an explanation in red (for example, a file type that is not accepted).</>,
      ],
    },
    reading: {
      title: "Reading Braille (Braille → Khmer or English)",
      imageAlt: "A Khmer Braille result with English words, and the word buttons (circled in red)",
      items: [
        <>Click the round button to switch to <strong>Braille → text</strong>, and choose the Braille type (Khmer or English).</>,
        <>Enter the Braille: type it with the <strong>Braille keyboard</strong> (each key = one cell, e.g. <code>,g</code> → ⠠⠛), paste Braille dots (untick the Braille keyboard first), or click <strong>"Choose file to upload"</strong> to upload a Braille file — the window shows BRF, BRL and PEF file icons (a .brf file = English Braille).</>,
        <><strong>English words in Khmer Braille</strong>: English and Khmer letters use the same Braille cells (⠛ = g = ក), and there is no marker. The website guesses the English words (words in an English dictionary, and words in capitals such as <code>,,vip</code>) and lists them under the result in <strong>"Words that may be English"</strong>.</>,
        <>Each word shows both readings (English ⇄ Khmer); the one in use is in bold. <strong>Click a word</strong> to switch it. Short words marked <strong>?</strong> are read as Khmer first — check them and click if they are English.</>,
        <><strong>English Braille</strong>: UEB uncontracted — capitals (<code>,</code> or <code>,,</code>), numbers (<code>#</code>) and English punctuation. Contracted English Braille (Grade 2) is not supported yet.</>,
      ],
      uploadAlt: "The Braille file upload window, with the BRF, BRL and PEF file icons",
    },
    listen: {
      title: "Listen to the result (English)",
      imageAlt: "The Listen to the result panel under an English result, with the Listen, Stop, Voice and Speed controls (circled in red)",
      items: [
        <>The <strong>"Listen to the result"</strong> panel appears under the result box when you translate <strong>English Braille → English</strong> (for example after uploading a .brf file).</>,
        <>Click <strong>"Listen"</strong> to start, <strong>"Pause"</strong> to pause and <strong>"Resume"</strong> to go on. <strong>"Stop"</strong> stops, and the next Listen starts from the beginning.</>,
        <><strong>Voice</strong>: the most natural voice is chosen for you. You can pick another one, and the website remembers your choice on this computer. In <strong>Microsoft Edge</strong> choose a voice with "Natural" in its name, and in <strong>Google Chrome</strong> a "Google" voice — they sound the most natural.</>,
        <><strong>Speed</strong>: from 0.75× (slow) to 1.5× (fast).</>,
        <>The voice comes from your browser, <strong>free of charge</strong>, and the text is not stored on our server. <strong>A Khmer voice is not available yet</strong>, so the panel is shown for English results only. If your browser cannot read aloud, use Edge or Chrome.</>,
      ],
    },
    more: {
      title: "Other features",
      items: [
        <><strong>Braille printer</strong>: download the G-Code file (.gcode) in Step 3, then follow the <Link to="/printer-guide" className="text-BlueDark underline">Printer Guide</Link> page to print on the machine.</>,
        <><strong>Contribute</strong>: institutes and teachers only send the <strong>Khmer text</strong> (letters, signs, words or sentences) <strong>with its Braille</strong>, or sample documents, on the <Link to="/contribute" className="text-BlueDark underline">Contribute</Link> page. That page shows a sample of real data and a CSV template. You do not need to edit any dictionary — our technical team checks everything and updates the system.</>,
        <><strong>Feedback</strong>: report a problem, a wrong translation or an idea on the <Link to="/feedback" className="text-BlueDark underline">Feedback</Link> page.</>,
      ],
    },
    notes: {
      title: "Notes:",
      items: [
        <>
          Whenever you write a number in the text, put one space after it.
          <p className="mx-4 mt-1">e.g. នៅក្នុងឆ្នាំ២០០៤ កុសលបានចាប់កំណើត (correct).</p>
          <p className="text-red-500 mx-4">e.g. នៅក្នុងឆ្នាំ២០០៤កុសលបានចាប់កំណើត (wrong).</p>
        </>,
        <>
          Whenever you write « », put a space after the opening sign and before the closing sign.
          <p className="mx-4 mt-1">e.g. « កុសលបានចាប់កំណើត​ » (correct).</p>
          <p className="text-red-500 mx-4">e.g. «កុសលបានចាប់កំណើត​» (wrong).</p>
        </>,
        <>PDF reading is not reliable yet — upload Word (.docx) or .txt files when you can.</>,
        <>Hover the mouse over a button to see what it does.</>,
      ],
    },
  },
};

const Guideline = () => {
  const { interfaceLang } = appStore();
  const c = content[interfaceLang] || content.km;

  // Screenshots of the site in the same interface language as the page
  const en = interfaceLang === "en";
  const sections = [
    { key: "header", image: en ? guidelineHeaderEn : guidelineHeader },
    { key: "direction", image: en ? guidelineControlsEn : guidelineControls, narrow: true },
    { key: "step1", number: "1", image: en ? guidelineStep1InputEn : guidelineStep1Input },
    { key: "upload", image: en ? guidelineUploadEn : guidelineUpload, narrow: true },
    { key: "equation", image: en ? guidelineStep1SymbolsEn : guidelineStep1Symbols },
    { key: "step2", number: "2", image: en ? guidelineStep2StatusEn : guidelineStep2Status },
    { key: "step3", number: "3", image: en ? guidelineStep3ResultEn : guidelineStep3Result },
    { key: "reading", image: en ? guidelineReadingEn : guidelineReading, extraImage: en ? guidelineUploadBrailleEn : guidelineUploadBraille },
    { key: "listen", image: en ? guidelineListenEn : guidelineListen },
    { key: "more" },
  ];

  return (
    <div className="lg:mt-24 mt-20 max-w-[100%] pb-16">
      <div className="flex justify-center text-center px-4">
        <h1 className="font-bold text-BlueDark text-xl md:text-2xl">{c.title}</h1>
      </div>
      <p className="text-center text-gray-600 text-base md:text-lg mt-2 px-4">
        {c.subtitle}
      </p>

      {/* Contents first, then Quick start, one above the other */}
      <div className="mt-8 flex flex-col gap-6 w-full max-w-4xl mx-auto px-5">
        <nav aria-label={c.toc} className="rounded-xl border border-BlueDark bg-white p-5">
          <h2 className="font-bold text-BlueDark text-lg md:text-xl mb-3">{c.toc}</h2>
          <ol className="space-y-1.5">
            {[...sections.map(({ key }) => [key, c[key].title]), ["notes", c.notes.title.replace(/[៖:]$/, "")]].map(
              ([key, title], i) => (
                <li key={key} className="flex gap-3">
                  <span className="w-6 text-right text-gray-500 shrink-0">{i + 1}.</span>
                  <a href={`#${key}`} className="text-BlueDark hover:underline">{title}</a>
                </li>
              )
            )}
          </ol>
        </nav>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold text-BlueDark text-lg md:text-xl mb-3">{c.quick.title}</h2>
          <ol className="space-y-2">
            {c.quick.items.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-BlueDark text-white text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {sections.map(({ key, number, image, extraImage, narrow }) => (
        <GuideSection
          key={key}
          id={key}
          number={number}
          title={c[key].title}
          image={image}
          imageAlt={c[key].imageAlt}
          extraImage={extraImage}
          extraImageAlt={c[key].uploadAlt}
          zoomHint={c.zoomHint}
          narrow={narrow}
        >
          <ol>
            {c[key].items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </GuideSection>
      ))}

      <section id="notes" className="mt-12 lg:mx-16 md:mx-10 mx-5 scroll-mt-24">
        <h2 className="font-bold text-red-500 text-lg md:text-xl mb-4">{c.notes.title}</h2>
        <ol className="custom-numbered-list text-base md:text-lg space-y-4">
          {c.notes.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default Guideline;
