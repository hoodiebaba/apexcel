"use client";

import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { useCallback } from "react";
import Arrow from "@/constants/svg/arrow.svg";

const articles = [
  {
    title: `Velit reprehenderit culpa Lorem reprehenderit excepteur ipsum esse.`,
    image: `/images/case-1.webp`,
    alt: `Proident pariatur est.`,
  },
  {
    title: `Velit reprehenderit culpa Lorem reprehenderit ipsum esse.`,
    image: `/images/case-2.webp`,
    alt: `Proident pariatur est.`,
  },
  {
    title: `Velit reprehenderit culpa Lorem reprehenderit excepteur esse.`,
    image: `/images/case-3.webp`,
    alt: `Proident pariatur est.`,
  },
];

export default function CasesSection() {
  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  return (
    <section className="relative w-full min-h-screen bg-gray-900">
      {/* Background Particles */}
      <div className="absolute left-0 top-0 h-full w-full">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            particles: {
              number: { value: 200, density: { enable: true, area: 800 } },
              move: { direction: "right", speed: 0.3 },
              size: { value: 1 },
              opacity: { value: 0.5 },
              links: { enable: false },
            },
          }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto pt-20 lg:pt-40 px-4">
        <h1 className="text-white text-4xl lg:text-7xl font-bold text-center">
          What will you build?
        </h1>
        <p className="text-gray-400 text-center text-xl mt-12">
          Don’t just take our word for it — see what leaders in digital are saying
        </p>

        <div className="mx-auto pt-24 flex flex-wrap justify-around">
          {articles.map((article) => (
            <div
              key={article.title}
              className="xl:w-1/3 sm:w-5/12 sm:max-w-xs relative mb-32 lg:mb-20
                         xl:max-w-sm lg:w-1/2 w-11/12 mx-auto sm:mx-0 cursor-pointer
                         hover:scale-105 transition-transform"
            >
              <div className="h-64 z-20">
                <img
                  src={article.image}
                  alt={article.alt}
                  className="h-full w-full object-cover rounded"
                  width={400}
                  height={300}
                />
              </div>
              <div className="p-4 shadow-lg w-full mx-auto -mt-8 bg-white rounded-b z-30 relative">
                <p className="uppercase text-sm text-gray-700 text-center pb-1">
                  Case study
                </p>
                <p className="text-gray-500 text-center pb-1 text-sm">
                  {article.title}
                </p>
              </div>
            </div>
          ))}
          <span className="flex items-center text-xl text-indigo-400 cursor-pointer z-30 hover:text-indigo-600">
            See all case studies
            <span className="h-6 w-6 fill-current ml-2">
              <Arrow />
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}