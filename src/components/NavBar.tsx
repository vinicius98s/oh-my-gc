import { cn } from "../utils/lib";

export type Page = "home" | "statistics" | "settings";

type NavBarProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  {
    id: "home",
    label: "Home",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "statistics",
    label: "Statistics",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function NavBar({ currentPage, onNavigate }: NavBarProps) {
  return (
    <nav className="h-10 flex items-center gap-1 px-4 bg-gray-900/50 border-b border-white/5">
      {navItems.map((item) => {
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "cursor-pointer relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200",
              "hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue/50",
              isActive ? "text-light-blue" : "text-gray-400 hover:text-gray-200"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue to-light-blue rounded-full" />
            )}
          </button>
        );
      })}

      <div className="ml-auto flex items-center">
        <button
          onClick={() => onNavigate("settings")}
          className={cn(
            "cursor-pointer p-2 rounded-lg transition-all duration-200 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue/50",
            currentPage === "settings"
              ? "text-light-blue"
              : "text-gray-400 hover:text-gray-200"
          )}
          title="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "w-5 h-5 transition-transform duration-500",
              currentPage === "settings" && "rotate-90"
            )}
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
