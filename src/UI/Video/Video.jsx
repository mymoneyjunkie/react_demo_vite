import { Fragment, useRef, useState, useEffect } from 'react';

import { Layout, Outer, Footer, Card, DateFormat, Pagination, CustomVideoPlayer, SocialMedia } from "../../components";

import { useSelector } from 'react-redux';

import { FaPlay, FaVolumeMute, FaComment, FaShareAlt } from "react-icons/fa";

import { IoEyeSharp } from "react-icons/io5";

import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

import { CiTimer } from "react-icons/ci";

import InfiniteScroll from 'react-infinite-scroll-component';

import Category from '../Category/Category';

import axios from '../../api/axios';

import { Link, useParams, useLocation, useNavigate } from "react-router-dom";

import {
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaTwitter,
  FaYoutube
} from 'react-icons/fa';
import { FaThreads } from "react-icons/fa6";

const IMG_BASE_URL = import.meta.env.VITE_IMG_URL;

const Video = () => {
  	const { id } = useParams();
  	const { search } = useLocation();

  	const queryParams = new URLSearchParams(search);
  	const title = queryParams.get("title");

  	const [ isValid, setIsValid ] = useState(false);
  	const navigate = useNavigate();
  	const [videoLoading, setVideoLoading] = useState(true);

  	const [page, setPage] = useState(1);
	const [itemsPerPage] = useState(10);
	const [hasMore, setHasMore] = useState(true);

	const { translations, currentLang } = useSelector((state) => state.lang);

	const [isLoading, setIsLoading] = useState(true);

	const [homeData, setHomeData] = useState({
		categories: [],
		trendingNow: [],
		trendingWeek: [],
		trendingMonth: [],
		trendingYear: [],
		posts: [],
		popdown: [],
		desktopAds: [],
		mobileAds: [],
		categoryPosts: []
	})

	const [dataLoading, setDataLoading] = useState({
		catLoading: false,
		nowLoading: false,
		weekLoading: false,
		monthLoading: false,
		postsLoading: false,
		popdownLoading: false,
		desktopAdsLoading: false,
		mobileAdsLoading: false,
		categoryPostsLoading: false
	})

	const [isDataLoaded, setIsDataLoaded] = useState(false);
	const [isImageLoaded, setIsImageLoaded] = useState(false);
	const [copied, setCopied] = useState(false);
	const [showDiv, setShowDiv] = useState(false);
  	const [getData, setGetData] = useState(null);
  	const [activePath, setActivePath] = useState(null);
  	const [imageData, setImageData] = useState(null);

	useEffect(() => {
		const isValidId = typeof id === "string" && /^[^<>]*$/.test(id);
		const isValidTitle = typeof title === "string" && /^[^<>]*$/.test(title);

		// console.log("ID valid:", isValidId);
		// console.log("Title valid:", isValidTitle);

		setIsValid(isValidId && isValidTitle);
	}, [id, title]);

	// Simulate data fetching (you can replace this with actual API calls)
	useEffect(() => {
		let isMounted = true;
		const controller = new AbortController();

	    const fetchData = async () => {
      		try {
			    const [
		          categoryData,
		          postsData,
		          popdownData,
		          desktopAdsData,
		          mobileAdsData
		        ] = await Promise.allSettled([
		          axios.get("/api/v1/user_web/category"),
		          axios.get(`/api/v1/user_web/post/${id}`),
		          axios.get("/api/v1/user_web/popdown"),
		          axios.get("/api/v1/user_web/desktopAds/1"),
		          axios.get("/api/v1/user_web/mobileAds/1")
		        ]);

		        // console.log(categoryData, trendingMonthData);

		        isMounted && setHomeData((prevState) => {
		        	return {
		        		...prevState,
						categories: isMounted &&  categoryData.status === "fulfilled" ? categoryData.value.data?.data || [] : [],
						posts: isMounted && postsData.status === "fulfilled" ? postsData.value.data?.data || [] : [],
						popdown: isMounted &&  popdownData.status === "fulfilled" ? popdownData.value.data?.data || [] : [],
						desktopAds: isMounted &&  desktopAdsData.status === "fulfilled" ? desktopAdsData.value.data?.data || [] : [],
						mobileAds: isMounted &&  mobileAdsData.status === "fulfilled" ? mobileAdsData.value.data?.data || [] : []
					}
				});

				isMounted && setDataLoading((prevState) => {
		        	return {
		        		...prevState,
						catLoading: categoryData.status === "fulfilled",
						postsLoading: postsData.status === "fulfilled",
						popdownLoading: popdownData.status === "fulfilled",
						desktopAdsLoading: desktopAdsData.status === "fulfilled",
						mobileAdsLoading: mobileAdsData.status === "fulfilled"
					}
				});

		        isMounted && setIsLoading(false);
		    } 

		    catch (error) {
		        console.error("Error fetching home data:", error);
		        // setError("Failed to load data");
		        setIsLoading(false);
		    }
		};

		isValid && fetchData();

		return () => {
			isMounted = false;
			controller.abort();
		}
	}, [isValid, id, title]);

	useEffect(() => {
	    let isMounted = true;
	    const controller = new AbortController();

	    const fetchData = async (term = trendingNow) => {
	      try {
	        setIsLoading(true);
	        const response = await axios.get(`/api/v1/user_web/trending?term=${term}`, {
	          signal: controller.signal,
	        });

	        const data = response.data;
	        if (isMounted && data?.isSuccess && data.data.length > 0) {
	          setHomeData((prev) => {
	            const newState = { ...prev };
	            // Store the data for the appropriate term
	            if (term === 'now') newState.trendingNow = data.data || [];
	            else if (term === 'week') newState.trendingWeek = data.data || [];
	            else if (term === 'month') newState.trendingMonth = data.data || [];
	            else if (term === 'year') newState.trendingYear = data.data || [];
	            return newState;
	          });
	        }
	      } catch (error) {
	        console.error(`Error fetching trending data for ${term}: `, error);
	      } finally {
	        if (isMounted) setIsLoading(false);
	      }
	    };

	    const tryFallbackData = async () => {
	      // If 'now' has no data, try the fallback terms
	      if (homeData.trendingNow.length === 0) {
	        const fallbackTerms = ['week', 'month', 'year'];
	        for (const term of fallbackTerms) {
	          await fetchData(term);
	          if (homeData[`trending${term.charAt(0).toUpperCase() + term.slice(1)}`].length > 0) {
	            break;  // Exit loop once we find data
	          }
	        }
	      } else {
	        // If 'now' has data, load the initial term
	        await fetchData('now');
	      }
	    };

	    tryFallbackData();

	    return () => {
	      isMounted = false;
	      controller.abort();
	    };
	}, []);

	useEffect(() => {
	  let isMounted = true;
	  const controller = new AbortController();

	  const fetchData = async () => {
	    try {
	      setDataLoading(prev => {
	      	return {
		        ...prev,
		        categoryPostsLoading: true // Set to true when fetch starts
		    }
	      });
	      
	      const catId = [homeData.posts[0]?.categories_id];
	      // console.log("cat found: ", !catId);
	      if (!catId) return;
	      
	      const res = await axios.get(`/api/v1/user_web/category_post/${parseInt(catId[0])}?page=${page}&items=${itemsPerPage}&filter=n`, {
	        signal: controller.signal
	      });
	      
	      const newPosts = res.data?.data || [];

	      // console.log(newPosts);
	      
	      if (isMounted) {
	        setHomeData((prev) => {
	        	return {
	          		...prev,
	          		categoryPosts: {
		            	data: page === 1 ? newPosts : [...(prev.categoryPosts?.data || []), ...newPosts],
		            	count: res.data?.totalCount
		          	}
		        }
	        });

	        // console.log("get data", newPosts.length >= itemsPerPage && 
	        //           (homeData.categoryPosts?.data?.length || 0) + newPosts.length < res.data?.totalCount);
	        
	        setHasMore(newPosts.length >= itemsPerPage && 
	                  (homeData.categoryPosts?.data?.length || 0) + newPosts.length < res.data?.totalCount);
	        
	        setDataLoading((prev) => {
	        	return {
		          ...prev,
		          categoryPostsLoading: false
		      	}
	        });
	      }
	    } catch (error) {
	      console.error("Error fetching category posts data:", error);
	      if (isMounted) {
	        setHasMore(false);
	        setDataLoading((prev) => {
	        	return {
	        		...prev,
	         		categoryPostsLoading: false
	        	}
	        });
	      }
	    } finally {
	      if (isMounted) setIsLoading(false);
	    }
	  };
	  
	  if (homeData.posts[0]?.categories_id) {
	    fetchData();
	  }
	  
	  return () => {
	    isMounted = false;
	    controller.abort();
	  };
	}, [page, homeData.posts]);

	const fetchMoreData = () => {
		// console.log("fetch second round: ", hasMore);
	  	if (hasMore) {
	    	setPage((prevPage) => prevPage + 1);
	  	}
	};

	  
	const getFirstNonEmptyTrending = () => {
	    if (homeData.trendingNow.length > 0) return homeData.trendingNow;
	    if (homeData.trendingWeek.length > 0) return homeData.trendingWeek;
	    if (homeData.trendingMonth.length > 0) return homeData.trendingMonth;
	    if (homeData.trendingYear.length > 0) return homeData.trendingYear;
	    return [];
	};

    const trendingToShow = getFirstNonEmptyTrending();

	// console.log(trendingToShow);

	const truncateText = (text, maxLength) => 
  		text?.length > maxLength ? `${text.split('').slice(0, maxLength).join('')}...` : text;

	// console.log(homeData.posts, homeData.categories);

	const handleTrendingClick = (id, title) => {
		// console.log(id, title);
		navigate(`/video/${id}?title=${title.slice(0, 5)}`);
	}

	const handleImageLoad = () => {
	    setIsImageLoaded(true); // Image is loaded
	}

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [id, title]);

	const handleCopy = async () => {
	    try {
	      await navigator.clipboard.writeText(window.location.href);
	      setCopied(true);
	      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
	    } catch (err) {
	      // Optionally handle error
	      setCopied(false);
	    }
	};

	const handleShowDiv = async (data, image, path) => {
		// console.log(data, path);
	    setGetData(data === "" ? window.location.href : data);
	    setImageData(image);
	    setActivePath(path); // Track which button triggered the action
	    setShowDiv(prev => {
	      // Only toggle if clicking the same path, otherwise force open
	      return activePath === path ? !prev : true;
	    });
  	};

	// useEffect(() => {
	//   console.log("Current page:", page);
	//   console.log("hasMore:", hasMore);
	//   console.log("categoryPosts data length:", homeData.categoryPosts?.data?.length);
	//   console.log("categoryPosts total count:", homeData.categoryPosts?.count);
	  
	//   // Rest of your effect...
	// }, [page, homeData.posts, homeData.categoryPosts]);

	// console.log(dataLoading.postsLoading);

	// console.log(homeData.posts);

	return (
		<Layout>
			<Outer className="min-h-full mt-15 md:mt-18">
				<div className="text-black sm:col-span-2 border-0"></div>
				<div className="text-black sm:col-span-8 bg-gray-50 dark:bg-black p-1 md:pt-2 lg:pt-2 border-0 rounded">
					{/*category*/}
					<Category categoryData={homeData.categories} catLoading={dataLoading.catLoading} />

					<div className="bg-gray-300 h-4 w-full" />

					<div className="grid grid-cols-1 md:grid-cols-8 gap-4 md:gap-2 mt-3">
						<div className="md:col-span-8 lg:col-span-5 bg-white dark:bg-black">
							{!dataLoading.postsLoading ? (
								<div className="flex flex-row sm:flex-col gap-4">
							        <div
							          className="h-60 w-full bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse shrink-0 sm:shrink"
							        ></div>
							    </div>
							) : (
								<div className="w-full bg-transparent">
								  {homeData.posts &&
								    homeData.posts.map(i => (
								    	<>
									      <div key={i.id} className={`relative w-full border-0 h-0 cursor-pointer ${i.link.includes("youtube") ? 'pb-[90%]' : 'pb-[56.25%]'}`}> {/* 16:9 Aspect Ratio */}
									    	{i.link && i.link.includes("youtube") ? (
											    // Extract video ID from the YouTube URL
											    (() => {
											      const url = new URL(i.link);
											      const videoId = url.searchParams.get("v"); // Extract video ID from "v" parameter
											      return (
											        <iframe
											          id="yt-player"
											          width="100%"
										              height="100%"
										              className="absolute top-0 left-0"
											          src={`https://www.youtube.com/embed/${videoId}?version=3&autoplay=0&mute=1&loop=0&controls=1`}
											          title="YouTube video player"
											          frameBorder="0"
											          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
											          allowFullScreen
											        />
											      );
											    })()
											) : (
												<CustomVideoPlayer 
													videoUrl={`${IMG_BASE_URL}/${i.video}`} 
													thumbnailUr={`${IMG_BASE_URL}/${i.image}`}
												/>
											)}
									      </div>

									      <div className="mt-5">
									      	{i.categories && (
											  <div className="flex flex-wrap gap-2 mt-2">
											    {i.categories.split(',').map((cat, idx) => (
											      <span
											        key={idx}
											        className="px-2 py-1 text-black dark:text-white border-2 border-black dark:border-white rounded text-sm text-gray-800 dark:text-gray-100"
											      >
											        {cat.trim()}
											      </span>
											    ))}
											  </div>
											)}
									      </div>

									      <div className="mt-5">
									      	<SocialMedia homeSocialData={i?.social_media} path="video" />

									      	<p className="text-lg my-3 text-wrap text-black dark:text-white">{currentLang == 'en' ? i.title : i.title_translate}</p>

									      	<div className="flex gap-8 items-center">
									      		<div className="flex gap-1 items-center">
									      			<IoEyeSharp className="text-black dark:text-white text-[30px]" /> 
									      			<span className="text-black dark:text-white">{i.views}</span>
									      		</div>
									      		<div className="flex gap-1 items-center">
									      			<CiTimer className="text-black dark:text-white text-[30px]" />
									      			<DateFormat homeDate={i.date} path="video" />
									      		</div>
									      	</div>

									      	<div className="mt-5 flex justify-between items-center gap-1">
									      		<div className="flex items-center gap-4">
										      		<button className="group border cursor-pointer hover:bg-black dark:border-white dark:hover:bg-white px-2 py-2 flex justify-center gap-1 rounded-lg">
													  <FaComment className="text-black dark:text-white group-hover:text-white dark:group-hover:text-black text-[20px]" />
													  <span className="text-md text-black dark:text-white group-hover:text-white dark:group-hover:text-black">
													    {i.comment_count}
													  </span>
													</button>

													<button onClick={() => handleShowDiv("", i.image, "share")} className="group border cursor-pointer hover:bg-black dark:border-white dark:hover:bg-white px-2 py-2 flex justify-center gap-1 rounded-lg">
													  <FaShareAlt className="text-black dark:text-white group-hover:text-white dark:group-hover:text-black text-[20px]" />
													  <span className="text-md text-black dark:text-white group-hover:text-white dark:group-hover:text-black">
													    Share
													  </span>
													</button>
												</div>

												<div className="flex items-center gap-4">
													<button className="cursor-pointer hover:text-gray-600" onClick={handleCopy}>
													    {copied ? 'Copied!' : 'Copy link'}
													</button>

													<button onClick={() => handleShowDiv(currentLang === 'en' ? i.des : i.des_translate, "", "more")} className="group border cursor-pointer hover:bg-black dark:border-white dark:hover:bg-white px-2 py-2 flex justify-center gap-1 rounded-lg">
													  <IoIosArrowDown className="text-black dark:text-white group-hover:text-white dark:group-hover:text-black text-[20px]" />
													  <span className="text-md text-black dark:text-white group-hover:text-white dark:group-hover:text-black">
													    More
													  </span>
													</button>
												</div>
									      	</div>

									      	<div className={`${showDiv ? 'block' : 'hidden'} p-5 bg-gray-300`}>
										        {/* Content for share/more section */}
										        {activePath === 'share' && (
										          <div className="flex gap-5 items-center justify-center">
										          	<a
													  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getData)}`}
													  target="_blank"
													  rel="noopener noreferrer"
													  className="text-2xl hover:scale-110 transition-transform"
													>
													  <FaFacebook className="text-[25px] text-black dark:text-white hover:text-blue-600" />
													</a>
										          	<Link 
										          		to={`https://twitter.com/intent/tweet?text=${getData}`}
												        target="_blank"
												        rel="noopener noreferrer"
												        className="text-2xl hover:scale-110 transition-transform"
												    >
										          		<FaTwitter className="text-[25px] text-black dark:text-white hover:text-sky-500" />
										          	</Link>
										          	<Link 
										          		to={`https://threads.net/intent/post?text=${getData}`}
												        target="_blank"
												        rel="noopener noreferrer"
												        className="text-2xl hover:scale-110 transition-transform"
												    >
										          		<FaThreads className="text-[25px] text-black dark:text-white hover:text-gray-800" />
										          	</Link>
										          </div>
										        )}
										        {activePath === 'more' && (
										          <div>More content for: {getData}</div>
										        )}
										      </div>
									      </div>
									    </>
								    ))}
								</div>
							)}
						</div>

						<div className="md:col-span-8 lg:col-span-3 w-full bg-white dark:bg-black flex flex-col justify-start">
							<h5 className="uppercase text-xl font-bold text-center">
								<span className="text-[#ee3483]">trending</span>
								<span className="text-[#00e5fa] ml-2">now</span>
							</h5>

							<div className="mt-4 px-3 flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-6 overflow-x-auto sm:overflow-x-visible whitespace-nowrap sm:whitespace-normal hide-scrollbar">
							  {isLoading ? (
							    <div className="flex flex-row sm:flex-col gap-4">
							      {[...Array(5)].map((_, index) => (
							        <div
							          key={index}
							          className="h-30 w-50 sm:w-full bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse shrink-0 sm:shrink"
							        ></div>
							      ))}
							    </div>
							  ) : (
							  	<div className="w-full grid grid-flow-col sm:grid-flow-row auto-cols-[70%] sm:auto-cols-auto sm:grid-cols-1 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible hide-scrollbar">
								  {trendingToShow &&
								    trendingToShow.map((i) => (
								      <div
								        key={i.id}
								        className="flex flex-col sm:flex-row bg-gray-800 rounded-md p-0 cursor-pointer"
								        onClick={() => handleTrendingClick(i.id, i.title)}
								      >
								        <div className="flex-2 sm:flex-1 h-30 sm:h-30">
								          <img
								            className="w-full h-full sm:w-full sm:h-full object-cover"
								            src={
								              i?.portrait_image
								                ? `${IMG_BASE_URL}/${i?.image}`
								                : "https://images.pexels.com/photos/30892416/pexels-photo-30892416.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
								            }
								            alt="Image"
								            style={{ width: '100%', height: '100%', objectFit: 'fill' }}
								          />
								        </div>
								        <div
								          className={`flex-1 text-sm px-2 text-wrap sm:h-full text-white uppercase ${
								            isLoading ? "bg-gray-400 animate-pulse" : ""
								          }`}
								        >
								          {truncateText(
								            currentLang === "en" ? i?.title : i?.title_translate,
								            40
								          )}
								        </div>
								      </div>
								    ))}
								</div>
							  )}
							</div>
						</div>

						<div className="md:col-span-8 lg:col-span-8 mt-10 bg-white dark:bg-black">
							{dataLoading.categoryPostsLoading && homeData.categoryPosts?.data?.length === 0 ? (
							    <div className="flex flex-row flex-wrap gap-4">
							      {[...Array(8)].map((_, index) => (
							        <div
							          key={index}
							          className="h-30 w-50 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse shrink-0 sm:shrink"
							        ></div>
							      ))}
							    </div>
							  ) : (
								<InfiniteScroll
								  dataLength={homeData.categoryPosts?.data?.length || 0} // Change from count to actual length
								  next={fetchMoreData}
								  hasMore={hasMore}
								  loader={<h4 className="text-center my-3 text-black dark:text-white">Loading...</h4>}
								  endMessage={
								    <p className="text-center text-gray-500 mt-4">
								      <b>No more posts to show</b>
								    </p>
								  }
								>
								  	<div className="border-0 flex flex-wrap justify-between sm:justify-start grid grid-cols-1 xd:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-6 sm:px-0 gap-4 md:gap-5 lg:gap-5 mt-5">									
									    {homeData.categoryPosts?.data?.map((item, index) => (
									      	<Card
												key={item.id}
												lang={currentLang}
												className=""
												trending={false}
												rounded={false}
												isPosts
												isDataLoaded={true}
												isImageLoaded={isImageLoaded}
												data={item}
												imgUpload={handleImageLoad}
												path="/video"
											/>
									    ))}
								  	</div>
								</InfiniteScroll>
							)}
						</div>

						<div className="md:col-span-8 lg:col-span-8 h-50 bg-white dark:bg-black"></div>
					</div>
				</div>
				<div className="text-black sm:col-span-2 border-0"></div>
			</Outer>
		</Layout>
	)
}

export default Video;