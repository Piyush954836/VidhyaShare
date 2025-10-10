const Card = ({ title, subtitle, children, className = "" }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300
        text-gray-900 dark:text-gray-100 ${className}`}
    >
      <h2 className="text-xl md:text-2xl font-bold mb-1">{title}</h2>
      {subtitle && <p className="text-gray-500 dark:text-gray-400">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
};

export default Card;
