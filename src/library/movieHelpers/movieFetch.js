export const fetchMovieByImdbId = async (imdbId) => {
  try {
    const response = await fetch(
      `http://www.omdbapi.com/?i=${imdbId}&type=movie&apikey=${process.env.OMDB_API_KEY}`
    );
    const {
      Actors,
      Genre,
      Plot,
      Poster,
      Released,
      Runtime,
      Title,
      imdbID,
      imdbRating,
    } = await response.json();
    const fetchedMovieData = {
      actors: Actors,
      title: Title,
      genre: Genre,
      plot: Plot,
      poster: Poster,
      released: Released,
      runtime: Runtime,
      imdbID: imdbID,
      imdbRating: imdbRating,
    };
    return fetchedMovieData;
  } catch (error) {
    console.log("error while trying to fetch movie by imdbID from omdp api");
    console.log(error);
  }
};
