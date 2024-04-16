// API key for authenticating requests.
const API_KEY = 'api_key=557e99e361d7950a41e885c3332ef166';
// Base URL for all API requests.
const BASE_URL = 'https://api.themoviedb.org/3';
// URL for fetching movies sorted by vote count.
const MOVIE_URL = BASE_URL + '/discover/movie?sort_by=vote_count.desc&' + API_KEY;
// URL for fetching TV shows sorted by vote count.
const TV_SHOWS_URL = BASE_URL + '/discover/tv?sort_by=vote_count.desc&' + API_KEY;
// Base URL for fetching images.
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
// URL for searching movies.
const searchURL = BASE_URL + '/search/movie?' + API_KEY;
// URL for fetching movie genres.
const MOVIE_GENRE_API = BASE_URL + '/genre/movie/list?' + API_KEY;
// URL for fetching TV show genres.
const TV_SHOW_GENRE_API = BASE_URL + '/genre/tv/list?' + API_KEY;

// Asynchronously fetches currently showcasing movies and creates a carousel.
async function fetchCurrentlyShowcasingMovies() {
  try {
    const url = `${BASE_URL}/movie/now_playing?${API_KEY}&page=1`;
    const data = await fetchJson(url); // Fetches JSON data from the API.
    createPosterCarousel(data.results); // Creates a carousel with the fetched movie data.
  } catch (error) {
    console.error(error); // Logs errors to the console.
  }
}

function getRatingColor(vote_average) {
  if (vote_average >= 7) return 'green';
  else if (vote_average >= 5) return 'yellow';
  else return 'red';
}

// Creates a poster carousel in the 'currentlyShowcasingCarousel' container.
function createPosterCarousel(items) {
  const carouselContainer = document.getElementById('currentlyShowcasingCarousel');
  carouselContainer.innerHTML = ''; // Clears existing carousel content.
  items.forEach(item => {
    const imageUrl = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : `https://image.tmdb.org/t/p/original${item.poster_path}`;
    const slide = createElement('div', {className: 'slide'}, `
      <div class="slide-background" style="background-image: url('${imageUrl}');" alt="Movie Poster" data-movie-id="${item.id}"></div>
      <div class="slide-content">
        <h3 class="title">${item.title}</h3>
        <p class="description">${item.overview}</p>
      </div>
    `);
    carouselContainer.appendChild(slide);
    // Adds a click event listener to each slide that triggers the display of movie details.
    slide.querySelector('.slide-background').addEventListener('click', function() {
      showMovieDetails(item.id);
    });
  });
  // Initializes the Slick Carousel plugin for interactive slides.
  $(carouselContainer).slick({
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 3,
      adaptiveHeight: true,
      swipeToSlide: true,
      touchThreshold: 30,
  });
}

document.addEventListener('DOMContentLoaded', (event) => {
  fetchCurrentlyShowcasingMovies();
});

// Creates a generic carousel for displaying either movies or TV shows.
function createCarousel(title, items) {
  const content = document.getElementById('content');
  const carouselContainer = document.createElement('div');
  carouselContainer.classList.add('carousel');
  carouselContainer.setAttribute('id', 'carouselContainer');

  const heading = document.createElement('h2');
  heading.textContent = title;
  content.appendChild(heading);

  items.forEach(item => {
    const slide = document.createElement('div');
    slide.classList.add('slide', 'poster-container');
    slide.setAttribute('data-id', item.id);

    // Media type and rating logic
    const mediaType = item.title ? 'Movie' : 'TV Show';
    const rating = item.vote_average.toFixed(1); // Format rating to one decimal place
    const ratingColor = getRatingColor(item.vote_average);

    // Inner HTML setup, including an overlay div for the rating and media type
    slide.innerHTML = `
      <div class="image-overlay">
        <div class="media-type-label">${mediaType}</div>
        <div class="rating-label" style="background-color: ${ratingColor};">${rating}</div>
        <img src="${IMG_URL + item.poster_path}" alt="${item.title || item.name}" class="movie-poster">
      </div>
      <div class="descriptions">
        <h1>${item.title || item.name}</h1>
        <p>${item.overview}</p>
      </div>
    `;
    carouselContainer.appendChild(slide);

    
  });

  content.appendChild(carouselContainer);

  // Configures responsive settings for different screen sizes using Slick Carousel.
  $(carouselContainer).slick({
    infinite: true,
    speed: 300,
    slidesToShow: 8,
    slidesToScroll: 1,
    swipeToSlide: true,
    touchThreshold: 30,
    responsive: [
      {
        breakpoint: 992,
        settings: { slidesToShow: 3 }
      },
      {
        breakpoint: 576,
        settings: { slidesToShow: 1 }
      }
    ]
  });
}
// Fetches media data based on type and sort order, then creates a carousel display.
function fetchMediaAndCreateCarousel(mediaType, sortBy, title) {
  // Optionally reads a sort value from a select element or uses the provided default.
  const sortSelect = document.getElementById('sortSelect'); 
  const sortByValue = sortSelect ? sortSelect.value : sortBy; 
  // Constructs the request URL with the chosen sort order.
  const URL = `${BASE_URL}/discover/${mediaType}?sort_by=${sortByValue}&${API_KEY}&page=1`;
  // Fetches the media data and processes it to create a carousel.
  fetch(URL)
    .then(response => response.json())
    .then(data => {
      createCarousel(title, data.results); // Uses the fetched data to create a carousel.
    })
    .catch(error => console.error('Error fetching data:', error)); // Catches and logs any fetch errors.
}


function showHomePage() {
  const content = document.getElementById('content');
  const carouselContainer = document.getElementById('newCarouselContainer');
  // Resets search input and clears any previous content.
  document.getElementById('searchInput').value = '';
  content.innerHTML = '';
  // Ensures the carousel container is visible.
  carouselContainer.style.display = 'block';
  // Populates the homepage with carousels for different categories of movies and TV shows.
  fetchMediaAndCreateCarousel('movie', 'popularity.desc', 'Popular Movies');
  fetchMediaAndCreateCarousel('tv', 'popularity.desc', 'Popular TV Shows');
  fetchMediaAndCreateCarousel('movie', 'vote_count.desc', 'Highest Rated Movies');
  fetchMediaAndCreateCarousel('tv', 'vote_count.desc', 'Highest Rated TV Shows');
}

// Fetches JSON data from a specified URL.
function fetchJson(url) {
  return fetch(url).then(response => response.json());
}

// Dynamically creates HTML elements with specified properties and children.
function createElement(tag, properties, ...children) {
  const element = document.createElement(tag);
  Object.assign(element, properties);
  children.forEach(child => {
    if (typeof child === 'string') {
      element.innerHTML += child;
    } else {
      element.appendChild(child);
    }
  });
  return element;
}

// Define a function to fetch all media types (movies, TV shows, etc.) from a given API URL
function fetchAllMedia(mediaType, apiUrl) {
  // Select the HTML element with ID 'content' and clear its current contents
  const content = document.getElementById('content');
  content.innerHTML = '';

  // Create a new div element to hold the media items and set its ID based on the media type
  const mediaContainer = document.createElement('div');
  mediaContainer.id = `${mediaType}Container`; // For example, 'movieContainer' or 'tvShowContainer'
  content.appendChild(mediaContainer);

  // Create a new div to display error messages and add it to the 'content' element
  const errorContainer = document.createElement('div');
  errorContainer.id = 'errorContainer';
  content.appendChild(errorContainer);

  // Initialize variables for pagination and loading state
  let page = 1;
  let isLoading = false;

  // Define a function to fetch media data from the API
  function fetchMedia() {
    // Prevent concurrent fetches
    if (isLoading) return;
    isLoading = true;

    // Fetch data from the API URL, appending the current page number as a query parameter
    fetch(`${apiUrl}&page=${page}`)
      .then(response => response.json())
      .then(data => {
        // Process each item in the fetched data
        data.results.forEach(item => {
          // Create a new div for each media item and set it up as a card
          const mediaCard = document.createElement('div');
          mediaCard.classList.add('card');
          mediaCard.setAttribute('data-id', item.id); // Store the media ID for retrieval on click

          // Format the rating to one decimal place and determine the color based on the rating
          const rating = item.vote_average.toFixed(1);
          const ratingColor = getRatingColor(item.vote_average);

          // Set labels and colors depending on the media type
          const typeLabel = mediaType === 'movie' ? 'Movie' : 'TV Show';
          const typeLabelColor = mediaType === 'movie' ? '#E50914' : '#221f1f';

          // Populate the media card with HTML content including image and text descriptions
          mediaCard.innerHTML = `
              <div class="poster-wrapper">
                  <div class="media-type-label" style="background-color: ${typeLabelColor};">${typeLabel}</div>
                  <div class="rating-label" style="background-color: ${ratingColor};">${rating}</div>
                  <img src="${IMG_URL + item.poster_path}" alt="${item.title || item.name}" class="media-poster">
              </div>
              <div class="descriptions">
                  <h1>${item.title || item.name}</h1>
                  <p>${item.overview}</p>
              </div>
          `;
          mediaContainer.appendChild(mediaCard);

        
        });

        // Update pagination and loading status based on response data
        if (data.page < data.total_pages) {
          page++;
          isLoading = false;
        } else {
          window.removeEventListener('scroll', handleScroll);
        }
      })
      .catch(error => {
        // Handle errors and update the error container
        console.error(error);
        errorContainer.innerText = `Failed to load ${mediaType}. Please try again later.`;
        isLoading = false;
      });
  }

  // Define a scroll handler to load more items when reaching the bottom of the page
  function handleScroll() {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Check if the user has scrolled to near the bottom of the page
    if (scrollTop + windowHeight >= documentHeight - 100) {
      fetchMedia();
    }
  }

  // Initially fetch media and set up the scroll event listener
  fetchMedia();
  window.addEventListener('scroll', handleScroll);
}

// Fetches and populates genre data for both movies and TV shows.
function populateGenres() {
  // Compiles URLs for movie and TV show genre listings.
  const urls = [`${BASE_URL}/genre/movie/list?${API_KEY}`, `${BASE_URL}/genre/tv/list?${API_KEY}`];
  
  // Simultaneously fetches genre data from both URLs.
  Promise.all(urls.map(fetchJson)).then(([movieData, tvShowData]) => {
    // Merges genres from both movie and TV show data, removing duplicates.
    const allGenres = [...new Set([...movieData.genres, ...tvShowData.genres].map(genre => genre.name))]
      .map(name => movieData.genres.concat(tvShowData.genres).find(genre => genre.name === name));

    // Populates the genre dropdown menu with links for each genre.
    document.getElementById('genreDropdownMenu').innerHTML = allGenres.map(genre =>
      `<li><a class="dropdown-item" href="#" onclick="showGenre(${genre.id})">${genre.name}</a></li>`
    ).join('');
  }).catch(error => console.error('Error:', error)); // Catches and logs any errors in the process.
}

// Function to display media (movies and TV shows) based on a specific genre
function showGenre(genreId) {
  // Access the 'content' and 'carouselContainer' elements from the DOM
  const content = document.getElementById('content');
  const carouselContainer = document.getElementById('newCarouselContainer');

  // Clear existing content and hide the carousel (used on other pages)
  content.innerHTML = '';
  carouselContainer.style.display = 'none';

  // Create containers within 'content' for movies, TV shows, and error messages
  const movieContainer = content.appendChild(createElement('div', {id: 'movieContainer'}));
  const tvShowContainer = content.appendChild(createElement('div', {id: 'tvShowContainer'}));
  const errorContainer = content.appendChild(createElement('div', {id: 'errorContainer'}));

  // Initialize variables for pagination and loading state
  let [moviePage, tvShowPage, isLoading] = [1, 1, false];

  // Scroll handler to load more items as the user scrolls to the bottom of the page
  const handleScroll = () => {
    const {scrollTop, scrollHeight} = document.documentElement;
    if (window.innerHeight + scrollTop >= scrollHeight - 100 && !isLoading) {
      fetchMoviesAndTVShows();
    }
  };

  // Function to fetch movies and TV shows by genre from the API
  function fetchMoviesAndTVShows() {
    isLoading = true; // Set loading state to prevent multiple concurrent requests

    // Construct URL queries for fetching movies and TV shows by genre, using API keys and sorting by vote count
    const urls = [
      `${BASE_URL}/discover/movie?with_genres=${genreId}&${API_KEY}&page=${moviePage}&sort_by=vote_count.desc`,
      `${BASE_URL}/discover/tv?with_genres=${genreId}&${API_KEY}&page=${tvShowPage}&sort_by=vote_count.desc`
    ];

    // Fetch both movies and TV shows data concurrently
    Promise.all(urls.map(fetchJson)).then(([movieData, tvShowData]) => {
      // Create and append movie cards to the movie container
      movieData.results.forEach(movie => {
        const movieCard = createCard(movie, 'Movie');
        movieContainer.appendChild(movieCard);
      });

      // Create and append TV show cards to the TV show container
      tvShowData.results.forEach(tvShow => {
        const tvShowCard = createCard(tvShow, 'TV Show');
        tvShowContainer.appendChild(tvShowCard);
      });

      // Update pagination if more pages are available
      moviePage += movieData.page < movieData.total_pages ? 1 : 0;
      tvShowPage += tvShowData.page < tvShowData.total_pages ? 1 : 0;
      isLoading = false; // Reset loading state
    }).catch(error => {
      // Handle errors and update the error container with a message
      console.error(error);
      errorContainer.innerText = 'Failed to load content. Please try again later.';
      isLoading = false;
    });
  }

  // Attach the scroll event listener and trigger the initial fetch of data
  window.addEventListener('scroll', handleScroll);
  fetchMoviesAndTVShows();
}

function createCard(item, mediaType) {
  const card = document.createElement('div');
  card.className = 'card';

  const rating = item.vote_average.toFixed(1); // Format rating to one decimal place
  const ratingColor = getRatingColor(item.vote_average);

  card.innerHTML = `
    <div class="poster-wrapper">
      <img src="${IMG_URL + item.poster_path}" alt="${item.title || item.name}" class="media-poster">
      <div class="media-type-label" style="background-color: ${mediaType === 'Movie' ? '#E50914' : '#221f1f'};">${mediaType}</div>
      <div class="rating-label" style="background-color: ${ratingColor};">${rating}</div>
    </div>
    <div class="descriptions">
      <h1>${item.title || item.name}</h1>
      <p>${item.overview}</p>
    </div>
  `;

  // Optional: Add any event listeners if needed, e.g., for displaying more details
  card.addEventListener('click', () => {
    showMovieDetails(item.id, mediaType.toLowerCase());
  });

  return card;
}

// Function to display the home page content
function showHomePage() {
  // Access the 'content' and 'carouselContainer' elements from the DOM
  const content = document.getElementById('content');
  const carouselContainer = document.getElementById('newCarouselContainer');

  // Reset the search input field and clear any existing content in the 'content' element
  document.getElementById('searchInput').value = '';
  content.innerHTML = '';

  // Ensure that the carousel is visible on the home page
  carouselContainer.style.display = 'block';

  // Fetch and display carousels for different categories using a generic function
  fetchMediaAndCreateCarousel('movie', 'popularity.desc', 'Popular Movies');
  fetchMediaAndCreateCarousel('tv', 'popularity.desc', 'Popular TV Shows');
  fetchMediaAndCreateCarousel('movie', 'vote_count.desc', 'Highest Rated Movies');
  fetchMediaAndCreateCarousel('tv', 'vote_count.desc', 'Highest Rated TV Shows');
}

// Function to display the movies page
function showMoviesPage() {
  // Access the 'content' and 'carouselContainer' elements from the DOM
  const content = document.getElementById('content');
  const carouselContainer = document.getElementById('newCarouselContainer');

  // Reset the search input field and clear any existing content in the 'content' element
  document.getElementById('searchInput').value = '';
  content.innerHTML = '';

  // Hide the carousel when viewing the movies page
  carouselContainer.style.display = 'none';

  // Fetch and display movie data using the 'fetchAllMedia' function with the specific API URL for movies
  fetchAllMedia('movie', MOVIE_URL);
}

// Function to display the TV shows page
function showTVShowsPage() {
  // Access the 'content' and 'carouselContainer' elements from the DOM
  const content = document.getElementById('content');
  const carouselContainer = document.getElementById('newCarouselContainer');

  // Reset the search input field and clear any existing content in the 'content' element
  document.getElementById('searchInput').value = '';
  content.innerHTML = '';

  // Hide the carousel when viewing the TV shows page
  carouselContainer.style.display = 'none';

  // Fetch and display TV show data using the 'fetchAllMedia' function with the specific API URL for TV shows
  fetchAllMedia('tv', TV_SHOWS_URL);
}


// Populates genre dropdowns and sets up the home page on window load.
function initializePage() {
  populateGenres(MOVIE_GENRE_API, 'movieGenreDropdown');
  populateGenres(TV_SHOW_GENRE_API, 'tvShowGenreDropdown');
  showHomePage();
}
window.onload = initializePage;