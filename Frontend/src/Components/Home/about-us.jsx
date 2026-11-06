import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import appStore from "../../store/app";
// innovation-center-pic.png cropped to the building: the full picture has English text in it
import innovation from "../../assets/innovation-center-building.jpg";
import idriLogo from "../../assets/idri-logo.png";
// Real photos and logos from the project's award folder (OneDrive: IDRI/23_China_Asean_Expo/Resource/Braille_Certificate_award)
import niseLogo from "../../assets/logo-nise.png";
import krousarThmeyLogo from "../../assets/logo-krousar-thmey.webp";
import trophies from "../../assets/about-trophies.webp";
import awardAsean from "../../assets/about-award-asean-2025.webp";
import awardInnovation from "../../assets/about-award-innovation-2025.webp";
import awardDigital from "../../assets/about-award-digital-2024.webp";
import awardAiForGood from "../../assets/about-award-ai-for-good.webp";
// Conference logos: CITA 2024 as sent by the project team; the others from the conferences' websites.
import confCita from "../../assets/conf-cita-2024.webp";
import confAiForGood from "../../assets/conf-ai-for-good.webp";
import confAcm from "../../assets/conf-acm-mmasia-2024.webp";
// This project's logo and the other IDRI projects' logos, as sent by the project team
import brailleLogo from "../../assets/khmer-braille-logo.webp";
import projectTts from "../../assets/project-khmer-tts.webp";
import projectAsr from "../../assets/project-khmer-asr.webp";
import projectEncoding from "../../assets/project-khmer-encoding.webp";
import projectFastype from "../../assets/project-fastype.webp";
import projectSokRobot from "../../assets/project-sok-robot.webp";
import projectJobMarket from "../../assets/project-job-market.webp";
import projectSimple from "../../assets/project-simple.webp";
import projectSimpleIcon from "../../assets/project-simple-icon.webp";
import projectHealthyRice from "../../assets/project-healthy-rice.webp";
import projectAmr from "../../assets/project-amr.webp";

// Same order as `partners`, `awards`, `presented` and `projects` in the content below
const PARTNER_LOGOS = [
  { src: niseLogo, alt: "NISE" },
  { src: krousarThmeyLogo, alt: "Krousar Thmey" },
];
const AWARD_PHOTOS = [awardAsean, awardInnovation, awardDigital, awardAiForGood];
const CONFERENCE_LOGOS = [confCita, confAiForGood, confAcm];
// Names from idri.edu.kh/research (Khmer TTS, Khmer ASR, Khmer Encoding Structure, Fastype, Sok Robot),
// written in the logo (Cambodia Job Market Analytics, SIMPLE) or given by the project team
// (Healthy Rice, AMR Project). SIMPLE has two logos: its icon and its name.
const PROJECT_LOGOS = [
  [projectTts], [projectAsr], [projectEncoding], [projectFastype], [projectSokRobot],
  [projectJobMarket], [projectSimpleIcon, projectSimple], [projectHealthyRice], [projectAmr],
];

// Page content per interface language.
// Facts come from idri.edu.kh, idri.edu.kh/?p=8194 (Khmer Braille project) and
// cadt.edu.kh (about, mission-vision, award news, January and March 2025).
const content = {
  km: {
    eyebrow: "អំពីយើង",
    title: "ធ្វើឱ្យអក្សរប្រៃខ្មែរកាន់តែងាយស្រួលសម្រាប់អ្នកគ្រប់គ្នា",
    intro:
      "គេហទំព័រនេះគឺជាប្រព័ន្ធបកប្រែអក្សរប្រៃខ្មែរដោយម៉ាស៊ីន ដែលបង្កើតឡើងដោយក្រុមអ្នកស្រាវជ្រាវនៃវិទ្យាស្ថានស្រាវជ្រាវ និងនវានុវត្តន៍ឌីជីថល (IDRI) នៃបណ្ឌិត្យសភាបច្ចេកវិទ្យាឌីជីថលកម្ពុជា (CADT) សហការជាមួយវិទ្យាស្ថានជាតិអប់រំពិសេស និងអង្គការគ្រួសារថ្មី។",
    photoAlt: "អគារមជ្ឈមណ្ឌលនវានុវត្តន៍ នៃបណ្ឌិត្យសភាបច្ចេកវិទ្យាឌីជីថលកម្ពុជា",
    highlights: [
      { icon: "mdi:medal-outline", text: "ពានរង្វាន់ជាតិ និងអន្តរជាតិ ៤" },
      { icon: "mdi:translate", text: "ខ្មែរ និងអង់គ្លេស → អក្សរប្រៃខ្មែរ" },
      { icon: "mdi:school-outline", text: "ឥតគិតថ្លៃសម្រាប់សាលាអប់រំពិសេស" },
    ],

    projectTitle: "គម្រោងបកប្រែអក្សរប្រៃខ្មែរដោយម៉ាស៊ីន",
    projectText:
      "ប្រព័ន្ធនេះបកប្រែអត្ថបទភាសាខ្មែរ ឬភាសាអង់គ្លេសទៅជាអក្សរប្រៃខ្មែរ។ គ្រូបង្រៀនប្រើវាដើម្បីរៀបចំឯកសារអានជាអក្សរប្រៃខ្មែរ សម្រាប់កុមារ និងសិស្សដែលពិការភ្នែក ឬខ្សោយភ្នែក និងដើម្បីបោះពុម្ពអក្សរប្រៃជាស្នាមលើក្រដាស។",
    goalsTitle: "គោលដៅ",
    goals: [
      "ជំនួសកម្មវិធីដែលត្រូវទិញអាជ្ញាប័ណ្ណ ដែលកំពុងប្រើនៅវិទ្យាស្ថានជាតិអប់រំពិសេស និងបកប្រែអក្សរខ្មែរដែលមានជើង និងស្រៈផ្សំខុស។",
      "ផលិតឯកសារអក្សរប្រៃបានកាន់តែច្រើន សម្រាប់អ្នកពិការភ្នែក និងអ្នកខ្សោយភ្នែក។",
    ],
    featuresTitle: "មុខងារសំខាន់ៗ",
    features: [
      "ប្រើលើគេហទំព័រ ឥតគិតថ្លៃ និងងាយស្រួលចូលប្រើសម្រាប់សាលាអប់រំពិសេសទាំងអស់ក្នុងប្រទេសកម្ពុជា។",
      "គាំទ្រអក្សរខ្មែរដែលមានរចនាសម្ព័ន្ធស្មុគស្មាញ និងរូបមន្តគណិតវិទ្យាពេញលេញ។",
      "លទ្ធផលច្រើនទម្រង់៖ អត្ថបទ Word, Braille ASCII (.brf) និង G-code សម្រាប់ម៉ាស៊ីនបោះពុម្ពអក្សរប្រៃ។",
    ],
    partnersTitle: "ដៃគូ",
    partners: [
      { name: "វិទ្យាស្ថានជាតិអប់រំពិសេស", text: "អង្គការគ្រួសារថ្មីស្ថិតនៅក្រោមវិទ្យាស្ថានជាតិអប់រំពិសេស។ យើងទទួលបានទិន្នន័យដោយផ្ទាល់ពីវិទ្យាស្ថាន ហើយប្រព័ន្ធនេះត្រូវបានអភិវឌ្ឍ សាកល្បង និងដាក់ឱ្យប្រើប្រាស់នៅវិទ្យាស្ថានជាតិអប់រំពិសេស ដើម្បីជំនួសកម្មវិធីដែលប្រើនៅទីនោះ។" },
      { name: "អង្គការគ្រួសារថ្មី", text: "ស្ថិតនៅក្រោមវិទ្យាស្ថានជាតិអប់រំពិសេស។ សៀវភៅណែនាំអក្សរប្រៃខ្មែររបស់អង្គការនេះ គឺជាឯកសារយោងសម្រាប់ច្បាប់បកប្រែ រួមទាំងគណិតវិទ្យា គីមីវិទ្យា និងជីវវិទ្យា។" },
    ],

    awardsTitle: "ពានរង្វាន់ និងការទទួលស្គាល់",
    trophiesAlt: "ពានរង្វាន់ពីរ និងបន្ទះពានរង្វាន់មាសមួយ ដែលគម្រោងបកប្រែអក្សរប្រៃខ្មែរបានទទួល",
    trophiesCaption: "ពានរង្វាន់ឌីជីថលអាស៊ាន ២០២៥ ពានរង្វាន់ឌីជីថលកម្ពុជា ២០២៤ និងបន្ទះពានរង្វាន់មាសនវានុវត្តន៍សាធារណៈ ២០២៥។",
    awards: [
      { medal: "gold", title: "មេដាយមាស ផ្នែកបរិយាប័ន្នឌីជីថល (Digital Inclusivity)", event: "ពានរង្វាន់ឌីជីថលអាស៊ាន ២០២៥ (ASEAN Digital Awards)", where: "ទីក្រុងបាងកក ប្រទេសថៃ · ខែមករា ឆ្នាំ២០២៥" },
      { medal: "gold", title: "មេដាយមាស", event: "ពានរង្វាន់នវានុវត្តន៍សាធារណៈកម្ពុជា ២០២៥", where: "ភ្នំពេញ · ខែមីនា ឆ្នាំ២០២៥ · អគ្គនាយកដ្ឋានវិទ្យាសាស្ត្រ បច្ចេកវិទ្យា និងនវានុវត្តន៍" },
      { medal: "award", title: "ការស្រាវជ្រាវ និងនវានុវត្តន៍ឌីជីថលល្អបំផុតប្រចាំឆ្នាំ", event: "ពានរង្វាន់ឌីជីថលកម្ពុជា ២០២៤ (Cambodia Digital Awards)", where: "កម្ពុជា" },
      { medal: "award", title: "ពានរង្វាន់ភាពងាយស្រួលប្រើប្រាស់ល្អបំផុត (Best Accessibility Award)", event: "AI for Good — Innovate for Impact (ITU)", where: "ទីក្រុងសៀងហៃ ប្រទេសចិន · ថ្ងៃទី៤ ខែកក្កដា ឆ្នាំ២០២៤" },
    ],
    presentedTitle: "បានបង្ហាញនៅ",
    presented: [
      { name: "សន្និសីទ CITA 2024", where: "ទីក្រុងដាណាង ប្រទេសវៀតណាម · ខែកក្កដា ឆ្នាំ២០២៤" },
      { name: "ITU AI for Good — Innovate for Impact", where: "ប្រទេសស្វីស · ខែកញ្ញា ឆ្នាំ២០២៤" },
      { name: "ACM Multimedia Asia 2024", where: "ទីក្រុងអូក្លិន ប្រទេសនូវែលសេឡង់ · ខែធ្នូ ឆ្នាំ២០២៤" },
    ],

    whoTitle: "តើពួកយើងជានរណា?",
    idriName: "វិទ្យាស្ថានស្រាវជ្រាវ និងនវានុវត្តន៍ឌីជីថល (IDRI)",
    idriText: [
      "វិទ្យាស្ថានស្រាវជ្រាវ និងនវានុវត្តន៍ឌីជីថល (IDRI) គឺជាស្ថាប័នស្រាវជ្រាវសាធារណៈមួយ ក្រោមបណ្ឌិត្យសភាបច្ចេកវិទ្យាឌីជីថលកម្ពុជា (CADT) ទទួលបន្ទុកស្រាវជ្រាវ និងអភិវឌ្ឍន៍ផ្នែកបច្ចេកវិទ្យាឌីជីថល និងការច្នៃប្រឌិតឌីជីថល និងការលើកកម្ពស់សហគ្រិនភាព ។",
      "គោលដៅរបស់យើងគឺដើម្បីបង្កើតដំណោះស្រាយដែលឆ្លើយតបទៅនឹងតម្រូវការរបស់ទាំងវិស័យសាធារណៈ និងឯកជន និងដើម្បីរួមចំណែកដល់ការអភិវឌ្ឍន៍សេដ្ឋកិច្ចឌីជីថល និងសង្គមនៃព្រះរាជាណាចក្រកម្ពុជា ។",
      "យើងបន្តបង្កើតក្រុមស្រាវជ្រាវប្រកបដោយគុណភាព និងបរិយាកាសការងារល្អ និងសហការជាមួយគ្រប់ភាគីពាក់ព័ន្ធទាំងក្នុងស្រុក និងក្រៅស្រុក សម្រាប់ការផ្ទេរចំណេះដឹង និងបច្ចេកវិទ្យា ។",
    ],
    missionTitle: "បេសកកម្មរបស់ពួកយើង",
    mission: [
      "R&D និង Technology Transfer លើបច្ចេកវិទ្យាឌីជីថលដែលផ្តោតលើបច្ចេកវិទ្យាដែលកំពុងរីកចម្រើនដូចជា AI, IoT, Data Science, Cyber Security ។",
      "លើកកម្ពស់ការច្នៃប្រឌិតឌីជីថល និងបច្ចេកវិទ្យា ។",
      "ធ្វើការសិក្សា និងស្រាវជ្រាវគោលនយោបាយយ៉ាងម៉ត់ចត់លើបច្ចេកវិទ្យាឌីជីថល និងផលប៉ះពាល់របស់វាទៅលើសេដ្ឋកិច្ច និងសង្គម ។",
      "ការទទួលស្គាល់ទេពកោសល្យឌីជីថល ។",
    ],
    visionTitle: "ចក្ខុវិស័យរបស់ពួកយើង",
    vision:
      "ដើម្បីក្លាយជាវិទ្យាស្ថានស្រាវជ្រាវ និងនវានុវត្តន៍ដ៏លេចធ្លោរបស់កម្ពុជា ជាមួយនឹងការទទួលស្គាល់ជាអន្តរជាតិនៅក្នុងបច្ចេកវិទ្យាឌីជីថល ដែលដោះស្រាយបញ្ហាប្រឈមសំខាន់ៗក្នុងសង្គម និងសេដ្ឋកិច្ចចំពេលមានការផ្លាស់ប្តូរឌីជីថលដ៏ឆាប់រហ័ស។",
    researchTitle: "វិស័យស្រាវជ្រាវ",
    research: [
      { icon: "mdi:alphabet-latin", text: "ដំណើរការភាសាធម្មជាតិខ្មែរ" },
      { icon: "mdi:brain", text: "វិទ្យាសាស្ត្រទិន្នន័យ និង AI" },
      { icon: "mdi:robot-outline", text: "មនុស្សយន្ត និង IoT" },
      { icon: "mdi:scale-balance", text: "ការស្រាវជ្រាវគោលនយោបាយឌីជីថល" },
    ],
    centersTitle: "មជ្ឈមណ្ឌល និងក្រុមការងារ",
    centers: [
      "មជ្ឈមណ្ឌលស្រាវជ្រាវ និងអភិវឌ្ឍន៍ឌីជីថល",
      "មជ្ឈមណ្ឌលស្រាវជ្រាវគោលនយោបាយឌីជីថល",
      "ក្រុមនវានុវត្តន៍ (ការផ្ទេរបច្ចេកវិទ្យា និងការអភិវឌ្ឍអាជីវកម្ម)",
    ],
    projectsTitle: "គម្រោងផ្សេងទៀតរបស់ IDRI",
    projects: [
      { name: "Khmer TTS", text: "អត្ថបទទៅជាសំឡេង" },
      { name: "Khmer ASR", text: "ការស្គាល់សំឡេងនិយាយ" },
      { name: "Khmer Encoding Structure", text: "រចនាសម្ព័ន្ធកូដអក្សរខ្មែរ" },
      { name: "Fastype", text: "ការវាយអក្សរខ្មែរលឿន" },
      { name: "Sok Robot", text: "រ៉ូបូតទទួលភ្ញៀវ" },
      { name: "Cambodia Job Market Analytics", text: "ការវិភាគទីផ្សារការងារ" },
      { name: "SIMPLE", text: "" },
      { name: "Healthy Rice", text: "" },
      { name: "AMR Project", text: "ភាពស៊ាំនឹងឱសថប្រឆាំងមេរោគ" },
    ],
    brailleLogoAlt: "ស្លាកសញ្ញាគម្រោងបកប្រែអក្សរប្រៃខ្មែរ",
    helpTitle: "ចង់ជួយកែលម្អប្រព័ន្ធនេះ?",
    helpText: "ស្ថាប័ន និងគ្រូបង្រៀនអាចផ្ញើសញ្ញា ការផ្គូផ្គងអក្សរប្រៃ ឬឯកសារគំរូ ហើយអ្នកគ្រប់គ្នាអាចផ្ញើមតិ។",
    contribute: "ចូលរួមចែករំលែក",
    feedback: "បញ្ចេញមតិ",
  },
  en: {
    eyebrow: "About us",
    title: "Making Khmer Braille easier for everyone",
    intro:
      "This website is the Khmer Braille Machine Translation system, built by researchers at the Institute of Digital Research & Innovation (IDRI) of the Cambodia Academy of Digital Technology (CADT), together with the National Institute for Special Education and Krousar Thmey.",
    photoAlt: "The Innovation Center building of the Cambodia Academy of Digital Technology",
    highlights: [
      { icon: "mdi:medal-outline", text: "4 national & international awards" },
      { icon: "mdi:translate", text: "Khmer & English → Khmer Braille" },
      { icon: "mdi:school-outline", text: "Free for special education schools" },
    ],

    projectTitle: "The Khmer Braille Machine Translation project",
    projectText:
      "The system translates Khmer or English text into Khmer Braille. Teachers use it to prepare Khmer Braille reading materials for children and students who are blind or have low vision, and to print embossed Braille on paper.",
    goalsTitle: "Goals",
    goals: [
      "Replace the licensed software used at the National Institute for Special Education, which makes mistakes with Khmer complex script.",
      "Produce more Braille documents for blind and low-vision readers.",
    ],
    featuresTitle: "Key features",
    features: [
      "Web-based, free and easy to reach for every special education school in Cambodia.",
      "Full support for Khmer complex script and mathematical formulas.",
      "Several output formats: text, Word, Braille ASCII (.brf) and G-code for the Braille printer.",
    ],
    partnersTitle: "Partners",
    partners: [
      { name: "National Institute for Special Education", text: "Krousar Thmey works under NISE. We received the data directly from NISE, and the system is developed, tested and used at NISE, where it replaces the software used today." },
      { name: "Krousar Thmey", text: "Works under NISE. Its Khmer Braille handbooks are the reference for the translation rules, including math, chemistry and biology." },
    ],

    awardsTitle: "Awards & recognition",
    trophiesAlt: "Two trophies and a gold plaque won by the Khmer Braille translation project",
    trophiesCaption: "ASEAN Digital Awards 2025, Cambodia Digital Awards 2024, and the Cambodia Public Innovation Awards 2025 gold plaque.",
    awards: [
      { medal: "gold", title: "Gold medal, Digital Inclusivity", event: "ASEAN Digital Awards 2025", where: "Bangkok, Thailand · January 2025" },
      { medal: "gold", title: "Gold medal", event: "Cambodia Public Innovation Awards 2025", where: "Phnom Penh · March 2025 · General Department of Science, Technology and Innovation" },
      { medal: "award", title: "Best Digital Research and Innovation of the Year", event: "Cambodia Digital Awards 2024", where: "Cambodia" },
      { medal: "award", title: "Best Accessibility Award", event: "AI for Good — Innovate for Impact (ITU)", where: "Shanghai, China · 4 July 2024" },
    ],
    presentedTitle: "Presented at",
    presented: [
      { name: "CITA 2024 conference", where: "Da Nang, Vietnam · July 2024" },
      { name: "ITU AI for Good — Innovate for Impact", where: "Switzerland · September 2024" },
      { name: "ACM Multimedia Asia 2024", where: "Auckland, New Zealand · December 2024" },
    ],

    whoTitle: "Who we are",
    idriName: "Institute of Digital Research & Innovation (IDRI)",
    idriText: [
      "The Institute of Digital Research & Innovation (IDRI) is a public research institution under the Cambodia Academy of Digital Technology (CADT), responsible for research and development in digital technology and digital innovation, and for promoting entrepreneurship.",
      "Our goal is to create solutions that meet the needs of both the public and private sectors, and to contribute to the development of the digital economy and society of the Kingdom of Cambodia.",
      "We keep building high-quality research teams and a good working environment, and we work with partners in Cambodia and abroad to transfer knowledge and technology.",
    ],
    missionTitle: "Our mission",
    mission: [
      "R&D and technology transfer in digital technology, focusing on emerging technologies such as AI, IoT, Data Science and Cyber Security.",
      "Promote digital and technology innovation.",
      "Carry out rigorous studies and policy research on digital technology and its impact on the economy and society.",
      "Recognise digital talent.",
    ],
    visionTitle: "Our vision",
    vision:
      "To be Cambodia's leading research and innovation institute, internationally recognised in digital technology, solving key social and economic challenges amid rapid digital transformation.",
    researchTitle: "Research areas",
    research: [
      { icon: "mdi:alphabet-latin", text: "Khmer Natural Language Processing" },
      { icon: "mdi:brain", text: "Data Science & AI" },
      { icon: "mdi:robot-outline", text: "Robotics & IoT" },
      { icon: "mdi:scale-balance", text: "Digital Policy Research" },
    ],
    centersTitle: "Centers and teams",
    centers: [
      "Digital Research and Development Center",
      "Digital Policy Research Center",
      "Innovation Team (technology transfer and business development)",
    ],
    projectsTitle: "Other IDRI projects",
    projects: [
      { name: "Khmer TTS", text: "Text to speech" },
      { name: "Khmer ASR", text: "Speech recognition" },
      { name: "Khmer Encoding Structure", text: "How Khmer text is encoded" },
      { name: "Fastype", text: "Fast Khmer typing" },
      { name: "Sok Robot", text: "Receptionist robot" },
      { name: "Cambodia Job Market Analytics", text: "Job market data" },
      { name: "SIMPLE", text: "" },
      { name: "Healthy Rice", text: "" },
      { name: "AMR Project", text: "Antimicrobial resistance" },
    ],
    brailleLogoAlt: "Logo of the Khmer Braille Machine Translation project",
    helpTitle: "Want to help improve this system?",
    helpText: "Institutes and teachers can send signs, Braille mappings or sample documents, and anyone can send feedback.",
    contribute: "Contribute",
    feedback: "Feedback",
  },
};

const SectionTitle = ({ children, id }) => (
  <h2 id={id} className="font-bold text-BlueDark text-xl md:text-2xl mb-5">
    {children}
  </h2>
);

const Bullets = ({ items, icon = "mdi:check-circle-outline", tone = "text-MainSucess" }) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item} className="flex gap-2">
        <Icon icon={icon} className={`text-xl shrink-0 mt-0.5 ${tone}`} aria-hidden="true" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const AboutUs = () => {
  const { interfaceLang } = appStore();
  const c = content[interfaceLang] || content.km;

  return (
    <div className="pb-8">
      {/* Hero: photo of the Innovation Center with the page title */}
      <section className="relative">
        <img
          src={innovation}
          alt={c.photoAlt}
          className="w-full h-56 md:h-80 lg:h-[26rem] object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-BlueDark/90 via-BlueDark/40 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 w-[90%] sm:w-[88%] lg:w-[85%] max-w-[1600px] mx-auto pb-6 md:pb-10 text-white">
          <p className="uppercase tracking-wide text-sm font-bold text-blue-200">{c.eyebrow}</p>
          <h1 className="font-bold text-2xl md:text-4xl mt-1 max-w-3xl">{c.title}</h1>
        </div>
      </section>

      <div className="w-[90%] sm:w-[88%] lg:w-[85%] max-w-[1600px] mx-auto">
        <p className="text-base md:text-lg text-gray-700 mt-8 max-w-4xl">{c.intro}</p>
        <ul className="flex flex-wrap gap-3 mt-6">
          {c.highlights.map((h) => (
            <li key={h.text} className="flex items-center gap-2 bg-white border rounded-full px-4 py-2 shadow-sm">
              <Icon icon={h.icon} className="text-xl text-BlueDark" aria-hidden="true" />
              <span className="text-sm md:text-base font-bold text-BlueDark">{h.text}</span>
            </li>
          ))}
        </ul>

        {/* The project */}
        <section className="mt-14" aria-labelledby="project">
          <div className="flex items-center gap-4 mb-5">
            <img src={brailleLogo} alt={c.brailleLogoAlt} className="w-14 h-14 md:w-16 md:h-16 rounded-xl shrink-0" />
            <h2 id="project" className="font-bold text-BlueDark text-xl md:text-2xl">{c.projectTitle}</h2>
          </div>
          <p className="text-base md:text-lg text-gray-700 max-w-4xl">{c.projectText}</p>
          <div className="grid md:grid-cols-2 gap-5 mt-6">
            <div className="bg-white border rounded-xl shadow-sm p-5 md:p-6">
              <h3 className="font-bold text-lg mb-3">{c.goalsTitle}</h3>
              <Bullets items={c.goals} icon="mdi:target" tone="text-BlueDark" />
            </div>
            <div className="bg-white border rounded-xl shadow-sm p-5 md:p-6">
              <h3 className="font-bold text-lg mb-3">{c.featuresTitle}</h3>
              <Bullets items={c.features} />
            </div>
          </div>

          <h3 className="font-bold text-lg mt-8 mb-3">{c.partnersTitle}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {c.partners.map((p, i) => (
              <div key={p.name} className="bg-white border rounded-xl shadow-sm p-5">
                <div className="h-16 flex items-center">
                  <img src={PARTNER_LOGOS[i].src} alt={PARTNER_LOGOS[i].alt} className="max-h-full w-auto max-w-[60%] object-contain" />
                </div>
                <p className="font-bold mt-3">{p.name}</p>
                <p className="text-sm md:text-base text-gray-600 mt-1">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Awards */}
        <section className="mt-14" aria-labelledby="awards">
          <SectionTitle id="awards">{c.awardsTitle}</SectionTitle>
          <figure className="mb-6">
            <img
              src={trophies}
              alt={c.trophiesAlt}
              className="w-full max-h-[26rem] object-contain bg-white rounded-xl border shadow-sm"
              loading="lazy"
            />
            <figcaption className="text-sm text-gray-500 mt-1">{c.trophiesCaption}</figcaption>
          </figure>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {c.awards.map((a, i) => (
              <div key={a.event} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <img src={AWARD_PHOTOS[i]} alt={a.event} className="w-full aspect-[4/3] object-cover" loading="lazy" />
                <div className="p-4 flex flex-col flex-1">
                  <p className="flex items-start gap-1.5 font-bold">
                    <Icon
                      icon={a.medal === "gold" ? "mdi:medal" : "mdi:trophy-award"}
                      className={`text-xl shrink-0 mt-0.5 ${a.medal === "gold" ? "text-amber-500" : "text-BlueDark"}`}
                      aria-hidden="true"
                    />
                    {a.title}
                  </p>
                  <p className="text-BlueDark mt-1">{a.event}</p>
                  <p className="text-sm text-gray-500 mt-auto pt-3">{a.where}</p>
                </div>
              </div>
            ))}
          </div>
          <h3 className="font-bold text-lg mt-8 mb-3">{c.presentedTitle}</h3>
          <ul className="grid md:grid-cols-3 gap-4">
            {c.presented.map((p, i) => (
              <li key={p.name} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="h-28 flex items-center justify-center bg-white border-b px-6 py-3">
                  <img src={CONFERENCE_LOGOS[i]} alt={p.name} className="max-h-full max-w-full w-auto object-contain" loading="lazy" />
                </div>
                <div className="p-4">
                  <p className="flex items-start gap-1.5 font-bold">
                    <Icon icon="mdi:presentation" className="text-xl text-BlueDark shrink-0 mt-0.5" aria-hidden="true" />
                    {p.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{p.where}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Who we are */}
        <section className="mt-14" aria-labelledby="who">
          <SectionTitle id="who">{c.whoTitle}</SectionTitle>
          <article className="bg-white border rounded-xl shadow-sm p-5 md:p-8">
            <img src={idriLogo} alt="IDRI" className="h-8 md:h-10 w-auto" />
            <h3 className="font-bold text-lg md:text-xl mt-4">{c.idriName}</h3>
            <div className="space-y-3 mt-3 text-gray-700">
              {c.idriText.map((p) => <p key={p}>{p}</p>)}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-bold mb-2">{c.missionTitle}</h4>
                <Bullets items={c.mission} icon="mdi:arrow-right-circle-outline" tone="text-BlueDark" />
              </div>
              <div>
                <h4 className="font-bold mb-2">{c.visionTitle}</h4>
                <p className="text-gray-700 border-l-4 border-amber-400 pl-4 italic">{c.vision}</p>
              </div>
            </div>

            <h4 className="font-bold mt-6 mb-2">{c.researchTitle}</h4>
            <ul className="grid sm:grid-cols-2 gap-2">
              {c.research.map((r) => (
                <li key={r.text} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                  <Icon icon={r.icon} className="text-xl text-BlueDark shrink-0" aria-hidden="true" />
                  <span>{r.text}</span>
                </li>
              ))}
            </ul>

            <h4 className="font-bold mt-6 mb-2">{c.centersTitle}</h4>
            <Bullets items={c.centers} icon="mdi:office-building-outline" tone="text-BlueDark" />

            <h4 className="font-bold mt-6 mb-3">{c.projectsTitle}</h4>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {c.projects.map((p, i) => (
                <li key={i} className="border rounded-xl bg-white p-3 flex flex-col items-center text-center">
                  <div className="h-20 w-full flex items-center justify-center gap-2">
                    {PROJECT_LOGOS[i].map((src, k) => (
                      <img
                        key={src}
                        src={src}
                        alt={k === 0 ? p.name : ""}
                        className={`max-h-full object-contain min-w-0 ${PROJECT_LOGOS[i].length > 1 ? "max-w-[48%]" : "max-w-full"}`}
                        loading="lazy"
                      />
                    ))}
                  </div>
                  <p className="font-bold text-sm md:text-base mt-2">{p.name}</p>
                  {p.text && <p className="text-xs md:text-sm text-gray-500">{p.text}</p>}
                </li>
              ))}
            </ul>
          </article>
        </section>

        {/* Help improve the system (contact details are in the footer) */}
        <section className="mt-14">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 md:p-6 flex flex-col">
            <Icon icon="mdi:hand-heart-outline" className="text-4xl text-BlueDark" aria-hidden="true" />
            <h2 className="font-bold text-BlueDark text-xl md:text-2xl mt-2">{c.helpTitle}</h2>
            <p className="mt-2 text-gray-700">{c.helpText}</p>
            <div className="flex flex-wrap gap-3 mt-auto pt-5">
              <Link to="/contribute" className="bg-BlueDark text-white font-bold rounded-full px-5 py-2 hover:opacity-90">
                {c.contribute}
              </Link>
              <Link to="/feedback" className="border-2 border-BlueDark text-BlueDark font-bold rounded-full px-5 py-2 hover:bg-BlueDark hover:text-white transition-colors">
                {c.feedback}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
