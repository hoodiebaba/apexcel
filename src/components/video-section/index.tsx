import Preferences from "@/constants/svg/preferences.svg";
import Play from "@/constants/svg/play.svg";

const PlayButton = () => (
  <button
    type="button"
    className="w-64 lg:w-auto absolute top-full left-1/2 flex items-center transform
               -translate-y-1/2 -translate-x-1/2 bg-white rounded-full font-medium 
               group p-4 shadow-xl"
    aria-label="play video"
  >
    <Play className="w-6 h-6 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
    <span className="ml-3">Watch the video (5 min)</span>
  </button>
);

const VideoSection = () => (
  <section className="bg-gradient-to-b from-gray-50 to-white shadow-inner">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col max-w-4xl mx-auto pt-28">
        <div className="w-full">
          <div className="relative shadow-2xl mx-6 lg:mx-0">
            <Preferences width="100%" height="100%" />
            <PlayButton />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default VideoSection;