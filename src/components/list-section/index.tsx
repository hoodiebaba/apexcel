import FeatureSvg from "@/constants/svg/features.svg";

const listItems = [
  {
    title: `Designers`,
    description: `Officia et fugiat mollit qui. Dolor elit aliqua voluptate ipsum
    excepteur cillum consequat consectetur duis magna qui eu consequat occaecat.
    Deserunt nisi sit.`,
  },
  {
    title: `Developers`,
    description: `Pariatur consectetur laboris exercitation duis laboris.
    Commodo duis fugiat magna fugiat et ut anim elit. Tempor aute ex qui
    tempor tempor.`,
  },
  {
    title: `Product owners`,
    description: `Ullamco consectetur ipsum eiusmod nisi adipisicing sint anim
    dolore aute excepteur. Voluptate ea ullamco sunt eu elit qui aliquip.
    Adipisicing.`,
  },
];

const ListSection = () => (
  <section className="lg:py-28 pt-28 overflow-hidden bg-white">
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Heading */}
      <div className="mb-16 text-center">
        <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
          Grow your revenue
        </h2>
        <p className="mt-2 pb-4 text-5xl lg:text-7xl font-bold tracking-tight text-gray-900">
          Transform your business
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-wrap -mx-8 items-center">
        {/* Left side - List */}
        <div className="w-full lg:w-1/2 px-8">
          <ul className="space-y-12">
            {listItems.map((item, index) => (
              <li className="flex -mx-4" key={item.title}>
                <div className="px-4">
                  <span className="flex w-16 h-16 mx-auto items-center justify-center 
                                   text-2xl font-bold rounded-full bg-blue-50 text-blue-500">
                    {index + 1}
                  </span>
                </div>
                <div className="px-4">
                  <h3 className="my-4 text-xl font-semibold">{item.title}</h3>
                  <p className="text-gray-500 leading-loose">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right side - Illustration */}
        <div className="w-full lg:w-1/2 px-8">
          <div className="lg:mb-0 pb-12 lg:pb-0 mt-16 lg:mt-0 mx-6 lg:mx-0">
            <FeatureSvg width="100%" height="100%" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ListSection;