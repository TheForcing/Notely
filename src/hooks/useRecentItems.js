import { useCallback, useEffect, useState } from "react";

const KEY = "notely_recent_items";
const MAX = 10;

export default function useRecentItems() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch {
        setItems([]);
      }
    }
  }, []);

  const save = (next) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const addItem = useCallback(
    (item) => {
      save([item, ...items.filter((i) => i.id !== item.id)].slice(0, MAX));
    },
    [items]
  );

  return {
    recentItems: items,
    addRecentItem: addItem,
  };
}
