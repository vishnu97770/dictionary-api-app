import { useState } from "react";
import axios from "axios";

function App() {

  const [word, setWord] = useState("");
  const [result, setResult] = useState(null);
  const [examples, setExamples] = useState([]);
  const [loadingMeaning, setLoadingMeaning] = useState(false);
  const [loadingExamples, setLoadingExamples] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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

  // Search Frequencies (Trending Words)
  const [wordFrequencies, setWordFrequencies] = useState(
    JSON.parse(localStorage.getItem("wordFrequencies")) || {}
  );

  const trendingWords = Object.entries(wordFrequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  // Suggestions
  const [suggestions, setSuggestions] = useState([]);

  const searchWord = async (query = null) => {
    const targetWord = typeof query === "string" ? query : word;
    if (!targetWord) return;

    setLoadingMeaning(true);
    setLoadingExamples(true);
    setError("");
    setResult(null);
    setExamples([]);
    setSuggestions([]);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

    try {

      const res1 = await axios.get(
        `${API_BASE_URL}/words/search/${targetWord}`
      );

      setResult(res1.data);
      setLoadingMeaning(false);

      const updatedHistory = [
        targetWord,
        ...history.filter((w) => w !== targetWord)
      ].slice(0, 5);

      setHistory(updatedHistory);
      localStorage.setItem("history", JSON.stringify(updatedHistory));

      setWordFrequencies((prev) => {
        const updated = { ...prev, [targetWord]: (prev[targetWord] || 0) + 1 };
        localStorage.setItem("wordFrequencies", JSON.stringify(updated));
        return updated;
      });

      try {
        const res2 = await axios.get(
          `${API_BASE_URL}/ai/example/${targetWord}`
        );
        setExamples(res2.data.examples || []);
      } catch (aiError) {
        console.error("AI examples error:", aiError);
      }
      setLoadingExamples(false);
      setSuggestions([]);

    } catch (error) {

      setError("Word not found. Try another word.");
      setLoadingMeaning(false);
      setLoadingExamples(false);
      setSuggestions([]);

    }

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
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-transform duration-200 hover:scale-105 active:scale-95"
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
          className="bg-blue-500 text-white px-6 rounded-r-lg hover:bg-blue-600 transition-transform duration-200 hover:scale-105 active:scale-95"
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
                searchWord(item);
              }}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
            >
              {item}
            </div>

          ))}

        </div>

      )}

      {/* Loading */}
      {loadingMeaning && (
        <p className="mt-6 text-blue-300 animate-pulse">
          Fetching meaning...
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

        <div className="mt-10 w-full max-w-xl bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/50">

          <div className="flex items-center justify-between mb-3">

            <h2 className="text-3xl font-bold text-blue-300">
              {result.word}
            </h2>

            <div className="flex gap-2">

              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(result.word)}
                className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {favorites.includes(result.word) ? "⭐" : "☆"}
              </button>

              {/* Pronunciation */}
              <button
                onClick={speakWord}
                className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-transform duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
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

          <div className="mt-4">

            <h3 className="text-lg font-semibold text-blue-300 mb-3">
              Example Sentences
            </h3>

            {loadingExamples ? (
              <p className="text-blue-300 animate-pulse italic">
                Generating examples...
              </p>
            ) : examples.length > 0 ? (
              <ul className="space-y-2 list-none">
                {examples.map((sentence, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 bg-gray-700 border-l-4 border-blue-400 rounded-lg px-4 py-3 group relative"
                  >
                    <span className="text-blue-400 font-bold text-sm mt-0.5 shrink-0">
                      {index + 1}.
                    </span>
                    <p className="text-gray-300 italic leading-relaxed flex-1 pr-8">
                      {sentence}
                    </p>
                    <button
                      onClick={() => copyToClipboard(sentence, index)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-white"
                      title="Copy sentence"
                    >
                      {copiedIndex === index ? (
                        <span className="text-green-400 text-xs font-semibold tracking-wide">Copied!</span>
                      ) : (
                        <span>📋</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">
                No example sentences available
              </p>
            )}

          </div>

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
                  searchWord(item);
                }}
                className="bg-gray-700 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition-transform duration-200 hover:scale-105 active:scale-95"
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
                  searchWord(item);
                }}
                className="bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                ⭐ {item}
              </button>

            ))}

          </div>

        </div>

      )}

      {/* Trending Words */}
      {trendingWords.length > 0 && (
        <div className="mt-10 w-full max-w-xl">
          <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
            <span>📈</span> Trending Words
          </h3>
          <div className="flex flex-wrap gap-2">
            {trendingWords.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setWord(item);
                  searchWord(item);
                }}
                className="bg-green-600/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-lg hover:bg-green-600/30 transition-transform duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <span>{item}</span>
                <span className="text-xs opacity-60">
                  ({wordFrequencies[item]})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;