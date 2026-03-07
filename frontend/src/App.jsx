import { useState } from "react";
import axios from "axios";

function App() {

  const [word, setWord] = useState("");
  const [result, setResult] = useState(null);
  const [example, setExample] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dark Mode Toggle
  const [darkMode, setDarkMode] = useState(true);

  // Search History
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history")) || []
  );

  // Favorites
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favorites")) || []
  );

  // Suggestions
  const [suggestions, setSuggestions] = useState([]);

  const searchWord = async () => {

    if (!word) return;

    setLoading(true);
    setError("");
    setResult(null);
    setExample("");
    setSuggestions([]);

    try {

      const res1 = await axios.get(
        `http://127.0.0.1:8000/words/search/${word}`
      );

      setResult(res1.data);

      const res2 = await axios.get(
        `http://127.0.0.1:8000/ai/example/${word}`
      );

      setExample(res2.data.example);

      const updatedHistory = [
        word,
        ...history.filter((w) => w !== word)
      ].slice(0, 5);

      setHistory(updatedHistory);
      localStorage.setItem("history", JSON.stringify(updatedHistory));

    } catch (error) {

      setError("Word not found. Try another word.");

    }

    setLoading(false);
  };

  const fetchSuggestions = async (value) => {

    setWord(value);

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    try {

      const res = await axios.get(
        `https://api.datamuse.com/sug?s=${value}`
      );

      const words = res.data.slice(0, 5).map(item => item.word);

      setSuggestions(words);

    } catch (error) {

      console.log("Suggestion error");

    }

  };

  // 🔊 Real Pronunciation Audio
  const speakWord = async () => {

    if (!result?.word) return;

    try {

      const res = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${result.word}`
      );

      const audio = res.data[0].phonetics.find(p => p.audio)?.audio;

      if (audio) {

        const sound = new Audio(audio);
        sound.play();

      } else {

        const utterance = new SpeechSynthesisUtterance(result.word);
        speechSynthesis.speak(utterance);

      }

    } catch {

      const utterance = new SpeechSynthesisUtterance(result.word);
      speechSynthesis.speak(utterance);

    }

  };

  // ⭐ Toggle Favorite
  const toggleFavorite = (word) => {

    let updated;

    if (favorites.includes(word)) {
      updated = favorites.filter((w) => w !== word);
    } else {
      updated = [...favorites, word];
    }

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <div className={`min-h-screen flex flex-col items-center p-10 
    ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6">

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>

      </div>

      {/* Title */}
      <h1 className="text-5xl font-bold mb-10 text-blue-400">
        LexiSearch
      </h1>

      {/* Search Box */}
      <div className="flex w-full max-w-xl">

        <input
          type="text"
          placeholder="Search a word..."
          className="flex-1 p-4 rounded-l-lg text-black outline-none"
          value={word}
          onChange={(e) => fetchSuggestions(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") searchWord();
          }}
        />

        <button
          onClick={searchWord}
          className="bg-blue-500 px-6 rounded-r-lg hover:bg-blue-600"
        >
          🔍
        </button>

      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (

        <div className="w-full max-w-xl bg-gray-800 rounded-lg mt-2">

          {suggestions.map((item, index) => (

            <div
              key={index}
              onClick={() => {
                setWord(item);
                setSuggestions([]);
              }}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
            >
              {item}
            </div>

          ))}

        </div>

      )}

      {/* Loading */}
      {loading && (
        <p className="mt-6 text-blue-300 animate-pulse">
          Searching...
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="mt-6 text-red-400">
          {error}
        </p>
      )}

      {/* Result */}
      {result && (

        <div className="mt-10 w-full max-w-xl bg-gray-800 p-6 rounded-xl shadow-xl">

          <div className="flex items-center justify-between mb-3">

            <h2 className="text-3xl font-bold text-blue-300">
              {result.word}
            </h2>

            <div className="flex gap-2">

              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(result.word)}
                className="bg-yellow-500 px-3 py-2 rounded-lg hover:bg-yellow-600"
              >
                {favorites.includes(result.word) ? "⭐" : "☆"}
              </button>

              {/* Pronunciation */}
              <button
                onClick={speakWord}
                className="bg-blue-500 px-3 py-2 rounded-lg hover:bg-blue-600"
              >
                🔊
              </button>

            </div>

          </div>

          {result.phonetic && (
            <p className="text-gray-400 italic mb-4">
              {result.phonetic}
            </p>
          )}

          <div className="mb-4">

            <h3 className="text-lg font-semibold text-blue-300 mb-1">
              Meaning
            </h3>

            <p className="text-gray-300">
              {result.definition}
            </p>

          </div>

          {example && (
            <div>

              <h3 className="text-lg font-semibold text-blue-300 mb-1">
                Example Sentence
              </h3>

              <p className="text-gray-400 italic">
                {example}
              </p>

            </div>
          )}

        </div>

      )}

      {/* Recent Searches */}
      {history.length > 0 && (

        <div className="mt-10 w-full max-w-xl">

          <h3 className="text-lg font-semibold text-blue-300 mb-3">
            Recent Searches
          </h3>

          <div className="flex flex-wrap gap-2">

            {history.map((item, index) => (

              <button
                key={index}
                onClick={() => {
                  setWord(item);
                  setTimeout(searchWord, 0);
                }}
                className="bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-600"
              >
                {item}
              </button>

            ))}

          </div>

        </div>

      )}

      {/* Favorite Words */}
      {favorites.length > 0 && (

        <div className="mt-10 w-full max-w-xl">

          <h3 className="text-lg font-semibold text-yellow-400 mb-3">
            Favorite Words
          </h3>

          <div className="flex flex-wrap gap-2">

            {favorites.map((item, index) => (

              <button
                key={index}
                onClick={() => {
                  setWord(item);
                  setTimeout(searchWord, 0);
                }}
                className="bg-yellow-600 px-3 py-1 rounded-lg hover:bg-yellow-700"
              >
                ⭐ {item}
              </button>

            ))}

          </div>

        </div>

      )}

    </div>
  );
}

export default App;