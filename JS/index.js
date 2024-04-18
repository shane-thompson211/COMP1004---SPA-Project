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


// Document ready function to set up everything
document.addEventListener('DOMContentLoaded', function() {
  // Fetch movies and set up the carousel
  fetchCurrentlyShowcasingMovies();
});

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
// Determine what colour the rating is
function getRatingColor(vote_average) {
  if (vote_average >= 7) return 'green';
  else if (vote_average >= 5) return 'yellow';
  else return 'red';
}

// Function to fetch and display details about a movie or TV show in a modal
function showMovieDetails(mediaId, mediaType = 'movie') {
  // Construct the URL for fetching movie/TV show details
  const DETAILS_URL = `${BASE_URL}/${mediaType}/${mediaId}?${API_KEY}&append_to_response=credits,videos,images${mediaType === 'movie' ? ',release_dates' : ''}`;

  // Fetch data from the constructed URL
  fetchJson(DETAILS_URL)
      .then(data => {
          // Select modal elements
          const modalBody = document.querySelector('#movieDetailsModal .modal-body');
          const modalFooter = document.querySelector('#movieDetailsModal .modal-footer');

          // Base URL for images
          const IMG_BASE_URL = 'https://image.tmdb.org/t/p/original';
          // Construct image URL
          const imageUrl = data.backdrop_path ? `${IMG_BASE_URL}${data.backdrop_path}` : `${IMG_BASE_URL}${data.poster_path}`;

          // Hide modal header
          document.querySelector('#movieDetailsModal .modal-header').style.display = 'none';

          // Function to format runtime
          const formatRuntime = runtime => `${Math.floor(runtime / 60)}h ${runtime % 60}m`;
          // Calculate runtime or set to 'N/A'
          const runtime = data.runtime ? formatRuntime(data.runtime) : 'N/A';

          // Determine title, age rating, and release date based on media type
          const title = mediaType === 'movie' ? data.title : data.name;
          const ageRating = mediaType === 'movie' && data.release_dates ? getCertification(data.release_dates.results) : 'N/A';
          const releaseDate = mediaType === 'movie' ? new Date(data.release_date).toLocaleDateString() : new Date(data.first_air_date).toLocaleDateString();

          // Check if the movie/TV show is in favorites
          const isFavorite = getFavorites().some(fav => fav.id === mediaId && fav.type === mediaType);
          // Determine text for favorite button
          const favoriteButtonText = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';

          // Set modal body content
          modalBody.innerHTML = `
              <div class="poster-wrapper">
                  <img src="${imageUrl}" alt="${title}" class="modal-poster-img">
                  <div class="poster-title">${title}</div>
              </div>
              <div class="modal-details">
                  <div class="modal-details-left">
                      <p><strong>Runtime:</strong> ${runtime}</p>
                      <p><strong>Age Rating:</strong> ${ageRating}</p>
                      <p><strong>Release Date:</strong> ${releaseDate}</p>
                  </div>
                  <div class="modal-details-right">
                      <p><strong>Genre:</strong> ${data.genres.map(genre => genre.name).join(', ')}</p>
                      <p><strong>Cast:</strong> ${data.credits.cast.slice(0, 3).map(actor => actor.name).join(', ')}</p>
                  </div>
              </div>
              <p class="modal-description"><strong>Description:</strong> ${data.overview}</p>
              <iframe src="https://www.youtube.com/embed/${getTrailerKey(data.videos.results)}" frameborder="0" allowfullscreen style="width: 100%; height: 300px;"></iframe>
          `;

          // Set modal footer content
          modalFooter.innerHTML = `
              <p><strong>Title:</strong> ${title}</p>
              <p><strong>Director:</strong> ${getDirector(data.credits.crew)}</p>
              <p><strong>Writers:</strong> ${getWriters(data.credits.crew)}</p>
              <p><strong>Cast:</strong> ${data.credits.cast.map(actor => actor.name).join(', ')}</p>
              <p><strong>Genre(s):</strong> ${data.genres.map(genre => genre.name).join(', ')}</p>
              <p><strong>Age Rating:</strong> ${ageRating}</p>
          `;
          
          // Create favorite button
          const favoriteButton = document.createElement('button');
          favoriteButton.textContent = favoriteButtonText;
          favoriteButton.className = 'btn ' + (isFavorite ? 'btn-success' : 'btn-outline-success');
          favoriteButton.onclick = () => {
              // Toggle favorite status
              toggleFavorite(mediaId, mediaType);
              // Update button text and style
              favoriteButton.textContent = getFavorites().some(fav => fav.id === mediaId && fav.type === mediaType) ? 'Remove from Favorites' : 'Add to Favorites';
              favoriteButton.classList.toggle('btn-success');
              favoriteButton.classList.toggle('btn-outline-success');
          };
          modalFooter.appendChild(favoriteButton);

          // Create share button
          const shareButton = document.createElement('button');
          shareButton.className = 'btn btn-primary';
          shareButton.textContent = 'Share';
          shareButton.onclick = () => shareMovieDetails(title, `Check out ${title}!`, window.location.href);
          modalFooter.appendChild(shareButton);

          // Show the modal
          $('#movieDetailsModal').modal('show');
      })
      .catch(error => {
          // Handle fetch errors
          console.error('Failed to load movie details:', error);
      });
}

// Function to get certification (age rating)
function getCertification(releaseDates) {
  const ukRelease = releaseDates.find(r => r.iso_3166_1 === 'GB');
  return ukRelease ? ukRelease.release_dates.find(rd => rd.certification).certification : 'Not Rated';
}

// Function to get trailer key
function getTrailerKey(videos) {
  const trailer = videos.find(video => video.type === "Trailer" && video.official);
  return trailer ? trailer.key : '';
}

// Function to get director's name
function getDirector(crew) {
  const director = crew.find(person => person.job === 'Director');
  return director ? director.name : 'N/A';
}

// Function to get writers' names
function getWriters(crew) {
  const writers = crew.filter(person => person.job === 'Writer' || person.job === 'Screenplay');
  return writers.length > 0 ? writers.map(writer => writer.name).join(', ') : 'N/A';
}

function createPosterCarousel(items) {
  const carouselContainer = document.getElementById('currentlyShowcasingCarousel');
  carouselContainer.innerHTML = ''; // Clears existing carousel content.
  items.forEach(item => {
      const imageUrl = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : `https://image.tmdb.org/t/p/original${item.poster_path}`;
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.innerHTML = `
        <div class="slide-background" style="background-image: url('${imageUrl}');" alt="Movie Poster" data-movie-id="${item.id}"></div>
        <div class="slide-content">
          <h3 class="title">${item.title}</h3>
        </div>
      `;
      carouselContainer.appendChild(slide);
  });

  // Initialize Slick Carousel
  $(carouselContainer).slick({
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 3,
      adaptiveHeight: true,
      swipeToSlide: true,
      touchThreshold: 30
  });

  // Manual drag detection
  let isDragging = false;
  let startX = 0;

  $('.slide-background').on('mousedown', function(event) {
      isDragging = false;
      startX = event.pageX; // Save the initial position
  }).on('mousemove', function(event) {
      if (Math.abs(event.pageX - startX) > 10) { // Check if the mouse has moved significantly
          isDragging = true;
      }
  }).on('mouseup', function() {
      if (!isDragging) {
          const movieId = $(this).data('movie-id');
          showMovieDetails(movieId);
      }
  });
}

// Fetches media data based on type and sort order, then creates a carousel display.
function fetchMediaAndCreateCarousel(mediaType, sortBy, title) {
  const URL = `${BASE_URL}/discover/${mediaType}?sort_by=${sortBy}&${API_KEY}&page=1`;
  fetch(URL)
    .then(response => response.json())
    .then(data => {
      createCarousel(title, data.results, mediaType); // Uses the fetched data to create a carousel.
    })
    .catch(error => console.error('Error fetching data:', error));
}

// Function to create carousels on the homepage to show "Popular TV or Movies".
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

    const mediaType = item.title ? 'movie' : 'tv'; // Correct media type assignment
    const rating = item.vote_average.toFixed(1); // Format rating to one decimal place
    const ratingColor = getRatingColor(item.vote_average);

    // Inner HTML setup, including an overlay div for the rating and media type
    slide.innerHTML = `
      <div class="image-overlay">
        <div class="media-type-label">${item.title ? 'Movie' : 'TV Show'}</div>
        <div class="rating-label" style="background-color: ${ratingColor};">${rating}</div>
        <img src="${IMG_URL + item.poster_path}" alt="${item.title || item.name}" class="movie-poster">
      </div>
      <div class="descriptions">
        <h1>${item.title || item.name}</h1>
        <p>${item.overview}</p>
      </div>
    `;

    carouselContainer.appendChild(slide);

    // Add advanced click/drag detection to each slide, now with correct media type handling
    addDragDetection(slide, item.id, mediaType);
  });

  content.appendChild(carouselContainer);

  // Initialize the carousel using Slick with responsive design settings
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

// Function to add drag detection to a slide and handle clicks correctly
function addDragDetection(slideElement, itemId, mediaType) {
  const $slide = $(slideElement);

  let isDragging = false;
  let startX = 0;

  $slide.on('mousedown touchstart', function(event) {
    isDragging = false;
    startX = event.pageX || event.originalEvent.touches[0].pageX;
  }).on('mousemove touchmove', function(event) {
    let moveX = event.pageX || event.originalEvent.touches[0].pageX;
    if (Math.abs(moveX - startX) > 10) {
      isDragging = true;
    }
  }).on('mouseup touchend', function() {
    if (!isDragging) {
      showMovieDetails(itemId, mediaType); // Ensure the correct media type is used when fetching details
    }
  });
}


// Show what is displayed on the homepage
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

// This is the image cards for both movies and tv shows on the Movies and TV show pages
function fetchAllMedia(mediaType, apiUrl) {
  const content = document.getElementById('content');
  content.innerHTML = ''; // Clear the content
  const mediaContainer = document.createElement('div');
  mediaContainer.id = `${mediaType}Container`; // e.g., movieContainer or tvShowContainer
  content.appendChild(mediaContainer);
  const errorContainer = document.createElement('div');
  errorContainer.id = 'errorContainer';
  content.appendChild(errorContainer);

  let page = 1;
  let isLoading = false;

  function fetchMedia() {
    if (isLoading) return; // Don't fetch if already loading
    isLoading = true;
    fetch(`${apiUrl}&page=${page}`)
      .then(response => response.json())
      .then(data => {
          data.results.forEach(item => {
              const mediaCard = document.createElement('div');
              mediaCard.classList.add('card');
              mediaCard.setAttribute('data-id', item.id); // Set the data-id attribute for later retrieval

              const rating = item.vote_average.toFixed(1); // Format rating to one decimal place
              const ratingColor = getRatingColor(item.vote_average);

              // Determining the type for the label
              const typeLabel = mediaType === 'movie' ? 'Movie' : 'TV Show';
              const typeLabelColor = mediaType === 'movie' ? '#E50914' : '#221f1f'; // Example colors

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

              // Attach event listener to the mediaCard for showing details
              mediaCard.addEventListener('click', function() {
                  const mediaId = this.getAttribute('data-id'); // Retrieve the stored ID
                  showMovieDetails(mediaId, mediaType); // Call to show details
              });
          });

          if (data.page < data.total_pages) {
              page++;
              isLoading = false;
          } else {
              window.removeEventListener('scroll', handleScroll);
          }
      })
      .catch(error => {
          console.error(error);
          errorContainer.innerText = `Failed to load ${mediaType}. Please try again later.`;
          isLoading = false;
      });
  }

  function handleScroll() {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= documentHeight - 100) {
        fetchMedia();
    }
  }

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

function searchContent() {
  const carouselContainer = document.getElementById('newCarouselContainer');
  carouselContainer.style.display = 'none';
  const content = document.getElementById('content');
  content.innerHTML = '';

  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  const searchUrls = {
    movie: `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&${API_KEY}&sort_by=vote_average.desc`,
    tv: `${BASE_URL}/search/tv?query=${encodeURIComponent(query)}&${API_KEY}&sort_by=vote_average.desc`,
  };

  Promise.all([
    fetchJson(searchUrls.movie),
    fetchJson(searchUrls.tv)
  ]).then(([movieData, tvData]) => {
    const combinedResults = [...(movieData.results || []), ...(tvData.results || [])];

    // Sort by vote average if necessary
    combinedResults.sort((a, b) => b.vote_average - a.vote_average);

    const container = createElement('div', {
      style: 'display: flex; flex-wrap: wrap; justify-content: center;',
    });

    combinedResults.forEach(item => {
      if (!item.poster_path || (!item.title && !item.name)) return;

      const mediaCard = createMediaCard(item);
      container.appendChild(mediaCard);

      mediaCard.addEventListener('click', () => {
        const mediaId = mediaCard.querySelector('img').getAttribute('data-id');
        const mediaType = item.title ? 'movie' : 'tv'; // Determine type based on presence of 'title' (movies have 'title', TV shows have 'name')
        showMovieDetails(mediaId, mediaType);
      });
    });

    content.appendChild(container);
  }).catch(error => {
    console.error('Error fetching combined data:', error);
    content.innerHTML = `<p>Error loading search results. Please try again.</p>`;
  });
}

document.getElementById('searchButton').addEventListener('click', function(event) {
  event.preventDefault(); // Prevent form submission
  searchContent();
});

document.getElementById('clearButton').addEventListener('click', function() {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
  showHomePage(); // Reset the content to the default view
});

function createMediaCard(item) {
  const IMG_URL = 'https://image.tmdb.org/t/p/w500';
  const posterPath = item.poster_path ? `${IMG_URL}${item.poster_path}` : 'path/to/default/image.jpg';
  const titleOrName = item.title || item.name || 'Unknown Title';
  const ratingColor = getRatingColor(item.vote_average);

  return createElement('div', {className: 'card'}, `
    <div class="poster-container">
      <img src="${posterPath}" alt="${titleOrName}" data-id="${item.id}" class="media-poster">
      <div class="media-type-label">${item.title ? 'Movie' : 'TV Show'}</div>
      <div class="rating-label" style="position: absolute; top: 0; left: 0; background-color: ${ratingColor}; padding: 2px 5px; border-radius: 0 5px 5px 0;">${item.vote_average.toFixed(1)}</div>
    </div>
    <div class="descriptions">
      <h1>${titleOrName}</h1>
      <p>${item.overview || 'No description available'}</p>
    </div>
  `);
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

let currentPage = ''; // This gets updated based on the page you're on
function showFavoritesPage() {
  currentPage = 'favorites';
  const content = document.getElementById('content');
  const carouselContainer = document.getElementById('newCarouselContainer');
  content.innerHTML = ''; // Clear the content
  carouselContainer.style.display = 'none'; // Hide the carousel on the favorites page

  const favoritesContainer = document.createElement('div');
  favoritesContainer.id = 'favoritesContainer'; // Use a consistent container ID for styling
  content.appendChild(favoritesContainer);

  const errorContainer = document.createElement('div');
  errorContainer.id = 'errorContainer';
  content.appendChild(errorContainer);

  const favorites = getFavorites();
  if (favorites.length === 0) {
    favoritesContainer.innerHTML = '<p>No favorites added yet.</p>';
    return;
  }

  favorites.forEach(favorite => {
    const DETAILS_URL = `${BASE_URL}/${favorite.type}/${favorite.id}?${API_KEY}`;

    fetchJson(DETAILS_URL)
      .then(data => {
        const mediaCard = document.createElement('div');
        mediaCard.classList.add('card');
        mediaCard.setAttribute('data-id', data.id);

        const typeLabel = favorite.type === 'movie' ? 'Movie' : 'TV Show'; // Label for the media type
        const ratingLabel = data.vote_average ? data.vote_average.toFixed(1) : 'N/A'; // Format the rating
        const ratingColor = getRatingColor(data.vote_average); // Call a function to determine color based on rating

        mediaCard.innerHTML = `
          <div class="poster-container">
            <img src="${IMG_URL + data.poster_path}" alt="${data.title || data.name}" class="media-poster">
            <div class="media-type-label" style="background-color: ${typeLabel === 'Movie' ? '#E50914' : '#221f1f'};">${typeLabel}</div>
            <div class="rating-label" style="background-color: ${ratingColor};">${ratingLabel}</div>
          </div>
          <div class="descriptions">
            <h1>${data.title || data.name}</h1>
            <p>${data.overview}</p>
          </div>
        `;
        favoritesContainer.appendChild(mediaCard);

        mediaCard.addEventListener('click', function() {
          showMovieDetails(data.id, favorite.type);
        });
      })
      .catch(error => {
        console.error('Failed to load favorite details:', error);
        errorContainer.innerText = 'Failed to load favorites. Please try again later.';
      });
  });
}

function isFavoritesPage() {
  return currentPage === 'favorites';
}

function saveFavorite(id, type) {
  const favorites = getFavorites();
  const newFavorite = { id, type };
  if (!favorites.some(fav => fav.id === id && fav.type === type)) {
    favorites.push(newFavorite);
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }
}

function updateFavoritesUI() {
  // Check if the current view is the favorites page
  if (currentPage === 'favorites') {
      showFavoritesPage(); // Re-render the favorites list
  }
}

function removeFavorite(id, type) {
  let favorites = getFavorites();
  favorites = favorites.filter(fav => !(fav.id === id && fav.type === type));
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function toggleFavorite(id, type) {
  const favorites = getFavorites();
  const index = favorites.findIndex(favorite => favorite.id === id && favorite.type === type);

  if (index > -1) {
      favorites.splice(index, 1); // Remove if already a favorite
  } else {
      favorites.push({ id, type }); // Add if not a favorite
  }

  localStorage.setItem('favorites', JSON.stringify(favorites));

  // Direct UI update without redundant page checks
  if (currentPage === 'favorites') {
      showFavoritesPage(); // Re-render the favorites list if on favorites page
  } else {
      // Optionally update UI elements like favorite buttons here if not on favorites page
      updateFavoriteButton(id, type);
  }
}

function updateFavoriteButton(id, type) {
    // Example: Update button label directly (simplistic approach, adapt as needed)
    const button = document.querySelector(`.favorite-btn[data-id="${id}"][data-type="${type}"]`);
    if (button) {
        const isFavorite = getFavorites().some(fav => fav.id === id && fav.type === type);
        button.textContent = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    }
}

// This could be the actual event handler for your "Remove from Favorites" button
function handleFavoriteToggle(event, id, type) {
  event.preventDefault(); // Prevent any default link behavior
  toggleFavorite(id, type);

  // Only refresh if you're currently viewing the favorites page
  if (currentPage === 'favorites') {
      showFavoritesPage(); // Dynamically update the content without navigating
  }
}

// Populates genre dropdowns and sets up the home page on window load.
function initializePage() {
  populateGenres(MOVIE_GENRE_API, 'movieGenreDropdown');
  populateGenres(TV_SHOW_GENRE_API, 'tvShowGenreDropdown');
  showHomePage();
}
window.onload = initializePage;