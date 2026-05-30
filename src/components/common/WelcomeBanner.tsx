"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface WelcomeBannerProps {
  role: string;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ role }) => {
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await api.get("/auth/check");
      return response.data.user;
    },
  });

  const name = isLoading ? "..." : userData?.display_name || userData?.username || role;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-1 transition-colors">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white/90">
        Hello, {name}! 👋
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">
        Welcome to your {role.charAt(0).toUpperCase() + role.slice(1)} dashboard.
      </p>
    </div>
  );
};

export default WelcomeBanner;
