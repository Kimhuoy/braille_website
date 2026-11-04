import React from "react";
import { Icon } from "@iconify/react";
import { useEffect } from "react";
import appStore from "../../store/app";

const SnackBar = () => {
  const { message, showSnackbar, onClose, isVisible, setIsVisile } = appStore();

  useEffect(() => {
    setIsVisile(showSnackbar);

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [showSnackbar, onClose]);

  return (
    <div
      className={`${
        isVisible ? "translate-x-0" : "translate-x-full"
      } fixed top-16 right-0 bg-MainSucess text-white w-[20vw] rounded-l-lg p-1 transform transition-transform duration-300 ease-in-out`}
    >
      <div className="flex items-center gap-2">
        <Icon icon="lets-icons:check-fill" className="text-xl ml-2" />
        <p className="text-base">{message}</p>
      </div>
    </div>
  );
};

export default SnackBar;
