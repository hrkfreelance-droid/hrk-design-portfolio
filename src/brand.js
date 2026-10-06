const cijd = import.meta.env.VITE_BRAND === "cijd";

export const brand = cijd
  ? {
      id: "cijd",
      label: "CIJD",
      pageTitle: "CIJD",
      contactUrl: "https://camboinfo.com/contacts/",
    }
  : {
      id: "hrk",
      label: "hrk_design",
      pageTitle: "hrk_design",
      contactUrl: "https://t.me/hiroki_pp",
    };

export const isCijd = cijd;
