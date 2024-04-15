const API_KEY = 'api_key=557e99e361d7950a41e885c3332ef166';
const BASE_URL = 'https://api.themoviedb.org/3';
const MOVIE_URL = BASE_URL + '/discover/movie?sort_by=vote_count.desc&' + API_KEY;
const TV_SHOWS_URL = BASE_URL + '/discover/tv?sort_by=vote_count.desc&' + API_KEY;
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const searchURL = BASE_URL + '/search/movie?' + API_KEY;
const MOVIE_GENRE_API = BASE_URL + '/genre/movie/list?' + API_KEY;
const TV_SHOW_GENRE_API = BASE_URL + '/genre/tv/list?' + API_KEY;

// Showcase the image carousel to show the current movies in theatres
async function fetchCurrentlyShowcasingMovies() {
  try {
    const url = `${BASE_URL}/movie/now_playing?${API_KEY}&page=1`;
    const data = await fetchJson(url);
    createPosterCarousel(data.results);
  } catch (error) {
    console.error(error);
  }
}

// Call the function to fetch currently showcasing movies on page load
document.addEventListener('DOMContentLoaded', (event) => {
    fetchCurrentlyShowcasingMovies();
  });

function createPosterCarousel(items) {
  const carouselContainer = document.getElementById('currentlyShowcasingCarousel');
  carouselContainer.innerHTML = '';

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

    // Adding click listener to the slide background
    slide.querySelector('.slide-background').addEventListener('click', function() {
        showMovieDetails(item.id);
    });
  });

  // Initialize the Slick Carousel with the specified options
  $(carouselContainer).slick({
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 3,
      adaptiveHeight: true,
      swipeToSlide: true,
      touchThreshold: 30,
  });
}
  function fetchJson(url) {
    return fetch(url).then(response => response.json());
  }
  
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

  function initializePage() {
    // Populate the genre dropdowns
    populateGenres(MOVIE_GENRE_API, 'movieGenreDropdown');
    populateGenres(TV_SHOW_GENRE_API, 'tvShowGenreDropdown');
  
    // Show the home page
    showHomePage();
  }
  
  // Call the function to fetch genres and initialize the page on window load
  window.onload = initializePage;