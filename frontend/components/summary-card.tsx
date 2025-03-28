"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const SummaryCard = ({
  icon,
  label,
  data,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  data: number;
  onClick?: {
    url: string;
  };
}) => {
  const router = useRouter();
  const handleClick = () => {
    if (onClick) {
      router.push(onClick.url);
    }
  };

  return (
    <div className="flex bg-muted/50 h-[50%] min-h-[7rem] rounded-xl shadow-md">
      <div className="p-6 w-full h-full flex flex-col justify-between items-start">
        <div
          className="flex gap-2 justify-center text-foreground/40 hover:cursor-pointer hover:text-foreground transition-all duration-200 ease-in-out"
          onClick={(e) => {
            e.preventDefault();
            handleClick();
          }}
        >
          <div className="text-sm ">{label}</div>
          <div className="flex w-[1rem]">
            <ArrowRight />
          </div>
        </div>

        <div className="flex gap-4 items-center justify-center">
          <div className="flex-grow">{icon}</div>
          <div className="text-3xl font-bold">{data}</div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
