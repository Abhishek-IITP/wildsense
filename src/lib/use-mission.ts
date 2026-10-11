import { useEffect, useState } from "react";
import { CATEGORY_IMAGES, FALLBACK_IMAGE, SAMPLE_MISSIONS } from "@/data/missions";
import { actions, useStore } from "./store";
import type { Mission } from "./types";

export function useMission(id: string): { mission: Mission | undefined; loading: boolean } {
  const { missions } = useStore();

  const getLocalMission = (): Mission | undefined => {
    if (!id) return undefined;
    const m = SAMPLE_MISSIONS.find((x) => x.id === id) ?? missions.find((x) => x.id === id);
    if (!m) return undefined;
    return {
      ...m,
      image: m.image ?? (CATEGORY_IMAGES[m.category] || FALLBACK_IMAGE),
    };
  };

  const initial = getLocalMission();
  const [mission, setMission] = useState<Mission | undefined>(initial);
  const [loading, setLoading] = useState<boolean>(!initial && Boolean(id));

  useEffect(() => {
    const local = getLocalMission();
    if (local) {
      setMission(local);
      setLoading(false);
      return;
    }

    if (!id) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetch(`/api/v1/missions/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Mission not found");
        const json = await res.json();
        const data = json.data as Mission;
        if (data && active) {
          const withImg: Mission = {
            ...data,
            image: data.image ?? (CATEGORY_IMAGES[data.category] || FALLBACK_IMAGE),
          };
          setMission(withImg);
          actions.addMission(withImg);
        }
      })
      .catch(() => {
        if (active) setMission(undefined);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, missions]);

  return { mission, loading };
}
