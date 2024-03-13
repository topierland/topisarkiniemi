import React, {useEffect, useRef, useState} from 'react';
import './App.scss';
import baseData from './data/untappd.json';
import { ReactComponent as Logo } from './logo.svg'

interface Beer {
  id: number;
  name: string;
  style: string;
  details: string;
  untappdRating?: string;
}

interface Brewery {
  id: number;
  name: string;
  beers: Beer[];
}

interface UserBeerData {
  userRating?: number;
  notes?: string;
  favorite?: boolean;
}

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showBeersWithoutUntappdRating, setShowBeersWithoutUntappdRating] = useState(false);
  const [minUntappdRating, setMinUntappdRating] = useState<number | ''>('');
  const [hasUserRating, setHasUserRating] = useState(false);
  const [sortOption, setSortOption] = useState('default');
  const [breweries, setBreweries] = useState<Brewery[]>(baseData); // Base data for breweries and beers
  const [userBeerData, setUserBeerData] = useState<Record<string, UserBeerData>>({}); // User data keyed by composite ID
  const [breweryVisibility, setBreweryVisibility] = useState<Record<number, boolean>>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Load filters/sorts from sessionStorage, data from localeStorage
    const loadedSettings = {
      searchQuery: sessionStorage.getItem('searchQuery') || '',
      showFavorites: sessionStorage.getItem('showFavorites') === 'true',
      showBeersWithoutUntappdRating: sessionStorage.getItem('showBeersWithoutUntappdRating') === 'true',
      minUntappdRating: sessionStorage.getItem('minUntappdRating') || '',
      hasUserRating: sessionStorage.getItem('hasUserRating') === 'true',
      sortOption: sessionStorage.getItem('sortOption') || 'default',
      breweryVisibility: JSON.parse(sessionStorage.getItem('breweryVisibility') || '{}'),
    };
    setSearchQuery(loadedSettings.searchQuery);
    setShowFavorites(loadedSettings.showFavorites);
    setShowBeersWithoutUntappdRating(loadedSettings.showBeersWithoutUntappdRating)
    setMinUntappdRating(loadedSettings.minUntappdRating !== null ? Number(loadedSettings.minUntappdRating) : '');
    setHasUserRating(loadedSettings.hasUserRating);
    setSortOption(loadedSettings.sortOption);
    setBreweryVisibility(loadedSettings.breweryVisibility);
    setInitialized(true)
  }, []);

  useEffect(() => {
    // Save filters/sorts to sessionStorage, data to localeStorage
    if (!initialized) {
      return
    }
    sessionStorage.setItem('searchQuery', searchQuery);
    sessionStorage.setItem('showFavorites', showFavorites.toString());
    sessionStorage.setItem('showBeersWithoutUntappdRating', showBeersWithoutUntappdRating.toString());
    sessionStorage.setItem('minUntappdRating', minUntappdRating.toString());
    sessionStorage.setItem('hasUserRating', hasUserRating.toString());
    sessionStorage.setItem('sortOption', sortOption);
    sessionStorage.setItem('breweryVisibility', JSON.stringify(breweryVisibility))
  }, [searchQuery, showFavorites, minUntappdRating, hasUserRating, sortOption, showBeersWithoutUntappdRating, breweryVisibility]);

  const getUserBeerData = (breweryId: number, beerId: number): UserBeerData | undefined => {
    const compositeKey = `${breweryId}-${beerId}`;
    return userBeerData[compositeKey];
  }

  const filteredAndSortedBreweries = breweries.map(brewery => ({
    ...brewery,
    beers: brewery.beers
        .map(beer => ({
          ...beer,
          userData: getUserBeerData(brewery.id, beer.id)
        }))
        .filter(({ name, untappdRating, userData }) => {
          const matchesSearchQuery = name.toLowerCase().includes(searchQuery.toLowerCase());
          const isFavorite = showFavorites ? userData?.favorite === true : true;
          const userRatingExists = !hasUserRating || userData?.userRating !== undefined;
          const untappdRatingCondition = showBeersWithoutUntappdRating
              ? untappdRating === '0'
              : (typeof minUntappdRating === 'number' && minUntappdRating !== 0
                  ? untappdRating !== undefined && parseFloat(untappdRating) >= minUntappdRating
                  : true);

          return matchesSearchQuery && isFavorite && userRatingExists && untappdRatingCondition
        })
        .sort((a, b) => {
          const aUntappdRating = parseFloat(a.untappdRating || '0');
          const bUntappdRating = parseFloat(b.untappdRating || '0');
          const aUserRating = a.userData?.userRating || 0;
          const bUserRating = b.userData?.userRating || 0;

          if (sortOption === 'untappdRating') {
            return bUntappdRating - aUntappdRating;
          } else if (sortOption === 'userRating') {
            return bUserRating - aUserRating;
          }
          return 0;
        }),
  }));

  const updateUserBeerData = (breweryId: number, beerId: number, data: UserBeerData) => {
    const compositeKey = `${breweryId}-${beerId}`;
    const updatedData = { ...userBeerData, [compositeKey]: data };
    setUserBeerData(updatedData);
    saveUserDataToLocalStorage(updatedData); // Assume this function is implemented
  }

  const loadUserDataFromLocalStorage = (): Record<string, UserBeerData> => {
    const data = localStorage.getItem('userBeerData');
    return data ? JSON.parse(data) : {};
  };

  const saveUserDataToLocalStorage = (userData: Record<string, UserBeerData>) => {
    localStorage.setItem('userBeerData', JSON.stringify(userData));
  };

  useEffect(() => {
    const userData = loadUserDataFromLocalStorage();
    setUserBeerData(userData);
  }, []);

  const handleFavorite = (breweryId: number, beerId: number) => {
    const existingData = userBeerData[`${breweryId}-${beerId}`] || {};
    updateUserBeerData(breweryId, beerId, { ...existingData, favorite: !existingData.favorite });
  };

  const handleUserRatingChange = (breweryId: number, beerId: number, rating: number) => {
    const existingData = userBeerData[`${breweryId}-${beerId}`] || {};
    updateUserBeerData(breweryId, beerId, { ...existingData, userRating: rating });
  };

  const handleNotesChange = (breweryId: number, beerId: number, notes: string) => {
    const existingData = userBeerData[`${breweryId}-${beerId}`] || {};
    updateUserBeerData(breweryId, beerId, { ...existingData, notes: notes });
  };

  const toggleBreweryVisibility = (breweryId: number) => {
    setBreweryVisibility(prevState => ({
      ...prevState,
      [breweryId]: !prevState[breweryId]
    }));
  };

  const areFiltersActive = searchQuery !== '' || showFavorites || hasUserRating || (typeof minUntappdRating === 'number' && minUntappdRating !== 0) || showBeersWithoutUntappdRating;
  const visibleBreweries = areFiltersActive ? filteredAndSortedBreweries.filter(brewery => brewery.beers.length > 0) : filteredAndSortedBreweries;

  const [filtersExpanded, setFiltersExpanded] = useState(false)

  const isAnyFilterActive = searchQuery !== '' ||
      showFavorites ||
      minUntappdRating > 0 ||
      hasUserRating ||
      showBeersWithoutUntappdRating

  return (
      <div>
          <header>
            <h1 className="header-title">BeerNoter</h1>
          </header>
        <div id={"filters"}>
          {filtersExpanded &&
              <>
                <input
                    type="text"
                    placeholder="Search beers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <label>
                  <input
                      type="checkbox"
                      checked={showFavorites}
                      onChange={(e) => setShowFavorites(e.target.checked)}
                  />
                  Show Starred
                </label>
                <label>
                  Min Untappd Rating
                  <input
                      type="number"
                      value={minUntappdRating}
                      onChange={(e) => setMinUntappdRating(e.target.value !== '' ? Number(e.target.value) : '')}
                  />
                </label>
                <label>
                  <input
                      type="checkbox"
                      checked={showBeersWithoutUntappdRating}
                      onChange={(e) => setShowBeersWithoutUntappdRating(e.target.checked)}
                  />
                  Show unrated on Untappd
                </label>
                <label>
                  <input
                      type="checkbox"
                      checked={hasUserRating}
                      onChange={(e) => setHasUserRating(e.target.checked)}
                  />
                  Show user rated
                </label>
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                  <option value="default">Default sorting</option>
                  <option value="untappdRating">Untappd rating</option>
                  <option value="userRating">User rating</option>
                </select>
              </>
          }
          <button onClick={() => setFiltersExpanded(!filtersExpanded)} className={isAnyFilterActive && !filtersExpanded ? "active filter-toggle" : "filter-toggle"}>
            {filtersExpanded ? "Hide filters & sorting" : isAnyFilterActive ? "Active filters" : "Show filters & sorting"}
          </button>
        </div>
        <div id={"beers"}>
          {visibleBreweries?.length < 1 &&
              <div className={"brewery-item"}>
                <h2>Fuck. No beers to show.</h2>
              </div>
          }
        {
          visibleBreweries.map(brewery => {
            const hasVisibleBeers = brewery.beers.length > 0
            const shouldShowBeers = areFiltersActive || breweryVisibility[brewery.id];

            return hasVisibleBeers && (
                    <div key={brewery.id} className={"brewery-item"}>
                      <h2 onClick={() => toggleBreweryVisibility(brewery.id)}>{brewery.name} <span>{brewery.beers.length} {brewery.beers.length > 1 ? "beers" : "beer"}</span></h2>
                      {shouldShowBeers && brewery.beers.map(beer => {
                        const compositeKey = `${brewery.id}-${beer.id}`;
                        const userData = userBeerData[compositeKey] || {};
                        return (
                            <div key={compositeKey} className={"beer-item"}>
                              <h3>{beer.name}</h3>
                              <p>Style: {beer.style}</p>
                              <p>Details: {beer.details}</p>
                              <p>Untappd Rating: {beer?.untappdRating ? parseFloat(beer.untappdRating).toFixed(2) : "N/A"}</p>
                              <input
                                  type="number"
                                  placeholder="Rate this beer"
                                  value={userData.userRating || ''}
                                  onChange={(e) => handleUserRatingChange(brewery.id, beer.id, parseInt(e.target.value))}
                                  min="0"
                                  max="5"
                              />
                              <textarea
                                  placeholder="Add notes"
                                  rows={4}
                                  value={userData.notes || ''}
                                  onChange={(e) => handleNotesChange(brewery.id, beer.id, e.target.value)}
                              />
                              <button onClick={() => handleFavorite(brewery.id, beer.id)} className={userData.favorite ? "starred" : ""}>
                                {userData.favorite ? 'Starred' : 'Star'}
                              </button>
                            </div>
                        );
                      })}
                    </div>
                )
              }
          )
        }
        </div>
        <footer>
          © Topi Särkiniemi {new Date().getFullYear()},<br/>all rights reserved.
        </footer>
      </div>
  );
}

export default App;
