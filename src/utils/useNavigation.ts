"use client";

import { useRouter } from 'next/navigation';

export const useNavigation = () => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return { handleNavigation }; 
};