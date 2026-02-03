import { useEffect, useState } from "react";

export function useReciters() {
  const [isLoading, setIsLoading] = useState(false);
  const [reciters, setReciters] = useState([]);

  useEffect(() => {
    const fetchReciters = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "https://quranapi.pages.dev/api/reciters.json",
        );
        const data = await response.json();

        // Convert object → array of { id, name }
        const formatted = Object.entries(data).map(([id, name]) => ({
          id: Number(id),
          name: name as string,
        }));

        setReciters(formatted);
      } catch (error) {
        console.error("Error fetching reciters:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReciters();
  }, []);

  return { reciters, isLoading };
}
