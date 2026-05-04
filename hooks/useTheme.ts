import { useEffect } from "react";
import { usePersistedState } from "./usePersistedState";

export function useTheme() {
  const [theme, setTheme] = usePersistedState<"light" | "dark">("theme", "light");

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") html.classList.add("dark");
    else html.classList.remove("dark");
  }, [theme]);

  return { theme, setTheme };
}
