import { Outlet } from "react-router-dom";
import TranslationPage from "../Translate/translation-page";
import FileUploadDialog from "../Translate/file-upload-dialog";
import appStore from "../../store/app";

const HomePage = () => {
  const { switchText, isPopupOpen, setIsPopupOpen } = appStore();

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* File upload window (opened from the "choose file" button inside the wizard) */}
      {isPopupOpen && <FileUploadDialog braille={switchText} onClose={handleClosePopup} />}

      <div className="mt-6 lg:mt-10">
        <TranslationPage />
      </div>

      <Outlet />
    </div>
  );
};

export default HomePage;
