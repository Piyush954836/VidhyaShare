const Button = ({ children, onClick, className = "", type = "button" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-white
        bg-blue-600 dark:bg-blue-500
        hover:bg-blue-700 dark:hover:bg-blue-600
        focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300
        transition-all duration-300
        ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
