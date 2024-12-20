"use client";

import { User, Tweet, GptResponse } from "@/types";
import { api, cn, formatUserDetails } from "@/utils";
import assert from "assert";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { parameters, titles } from "@/consts";
import Button from "@/components/Button";
import Image from "next/image";
import LoadingSplash from "@/components/LoadingSplash";
import { Modal } from "@/components/Modal";

export default function Cracked() {
  const [isLoading, setIsLoading] = useState(false);
  const [conclusion, setConclusion] = useState("");
  const [scores, setScores] = useState<number[]>(Array(4).fill(0));
  const [title, setTitle] = useState("");
  const [openModalIndex, setOpenModalIndex] = useState<number | null>(null);

  const overall = scores.reduce((a, b) => a + b, 0) / scores.length;

  const pathname = usePathname();
  const username = pathname.replace("/cracked/", "");

  useEffect(() => {
    async function analyzeUser(): Promise<void> {
      setIsLoading(true);

      // fetch user
      const userResponse = await api.fetch<User>("user", { username });
      assert(
        !userResponse.error,
        userResponse.error || "Failed to fetch user data"
      );
      assert(userResponse.data, "No user data received");

      // fetch user's tweets
      const tweetsResponse = await api.fetch<Tweet[]>("tweets", {
        userId: userResponse.data.id_str,
      });
      assert(
        !tweetsResponse.error,
        tweetsResponse.error || "Failed to fetch tweets"
      );
      assert(tweetsResponse.data, "No tweet data received");

      const userDetails = formatUserDetails(
        userResponse.data,
        tweetsResponse.data
      );
      // fetch completion
      const gptResponse = await api.fetch<GptResponse>("gpt", { userDetails });
      assert(!gptResponse.error, gptResponse.error || "Analysis failed");

      const [conclusionLine, ...scoreLines] = gptResponse.data.completion
        .split("\n")
        .map((line: string) => line.trim());
      setConclusion(conclusionLine);

      const parsedScores = scoreLines.map((line: string) => parseInt(line, 10));
      setScores(parsedScores);

      setIsLoading(false);
    }

    analyzeUser();
  }, [pathname, username]);

  useEffect(() => {
    function titleSelector(score: number): string {
      const bracket = Math.floor(score / 10) * 10;
      return titles[bracket][Math.floor(Math.random() * 5)];
    }
    setTitle(titleSelector(overall));
  }, [overall]);

  function handleTwitterShare() {
    const shareUrl = "https://crackedlyzer.vercel.app";
    const shareText = `bro I'm a ${title}\nCheck out your crackedness level at`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;

    window.open(twitterUrl, "_blank");
  }

  function getDynamicGradient(score: number) {
    if (score >= 80) {
      return "high-score-gradient"; // Golden
    } else if (score >= 50) {
      return "mid-score-gradient"; // Green
    } else {
      return "low-score-gradient"; // Reddish
    }
  }

  if (isLoading) {
    return <LoadingSplash />;
  }

  return (
    <div className="h-screen border border-black flex flex-col items-center">
      <Navbar />
      <div className="my-auto flex flex-col items-center px-4 sm:px-20">
        <h1 className="text-3xl text-center sm:text-5xl font-extrabold">
          {title}
        </h1>
        <div className="flex flex-col gap-4 mt-10 rounded-md border-2 p-4 sm:p-8 max-w-[1024px] bg-foreground">
          <div
            className={cn(
              "text-2xl sm:text-4xl font-bold",
              getDynamicGradient(overall)
            )}
          >
            Overall: {overall}%
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="w-full  sm:w-1/2">
              <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2">
                {parameters.map((x, i) => {
                  const dynamicGradient = getDynamicGradient(scores[i]);
                  return (
                    <button
                      key={x.title}
                      onClick={() => setOpenModalIndex(i)}
                      className="flex flex-col items-center sm:items-start md:items-center md:flex-row md:gap-2 font-bold hover:opacity-70 text-sm sm:text-lg md:text-xl lg:text-3xl py-4"
                    >
                      <div
                        className={cn(
                          "flex items-center gap-2 font-semibold whitespace-nowrap",
                          dynamicGradient,
                          "animated-gradient"
                        )}
                      >
                        <p>{x.title}:</p>
                      </div>
                      <span
                        className={cn(
                          "font-bold",
                          dynamicGradient,
                          "animated-gradient"
                        )}
                      >
                        {scores[i]}%
                      </span>
                    </button>
                  );
                })}
                {openModalIndex !== null && (
                  <Modal
                    onClose={() => setOpenModalIndex(null)}
                    className="border"
                  >
                    <p className="py-2 px-4">
                      {parameters[openModalIndex].description}
                    </p>
                  </Modal>
                )}
              </div>
            </div>
            <span className="w-full h-0 sm:w-0 sm:min-h-full border" />
            <div className="w-full sm:w-1/2 font-bold">{conclusion}</div>
          </div>
        </div>
        <Button
          onClick={handleTwitterShare}
          className="mt-6 flex items-center justify-center gap-2 w-full bg-white text-background"
        >
          Share on
          <Image src="/X.svg" alt={"X logo"} width={24} height={24} />
        </Button>
      </div>

      <Footer />
    </div>
  );
}
