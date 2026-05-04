import { useEffect } from "react";
import { UserPreferences } from "../lib/settings/preferences";

export function useApplyPreferences(prefs: UserPreferences) {
  useEffect(() => {
    const body = document.body;

    body.classList.remove("font-system", "font-serif", "font-mono");
    body.classList.add(`font-${prefs.font}`);

    body.classList.remove("text-compact", "text-normal", "text-large");
    body.classList.add(`text-${prefs.textSize}`);
  }, [prefs.font, prefs.textSize]);
}
