import React, {useEffect, useRef, useState} from 'react';
import './App.scss';
import baseData from './data/untappd.json';
import { ReactComponent as Star } from './star.svg'
import { ReactComponent as Starred } from './starred.svg'

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
  userRating?: string;
  notes?: string;
  favorite?: boolean;
}

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showBeersWithoutUntappdRating, setShowBeersWithoutUntappdRating] = useState(false);
  const [minUntappdRating, setMinUntappdRating] = useState<string>('');
  const [hasUserRating, setHasUserRating] = useState(false);
  const [sortOption, setSortOption] = useState('default');
  const [userBeerData, setUserBeerData] = useState<Record<string, UserBeerData>>({}); // User data keyed by composite ID
  const [breweryVisibility, setBreweryVisibility] = useState<Record<number, boolean>>({});
  const [userBreweries, setUserBreweries] = useState<Brewery[]>([])
  const [breweries, setBreweries] = useState<Brewery[]>(baseData); // Base data for breweries and beers
  const [initialized, setInitialized] = useState(false);

  /*
  const mergeData = (userData : Brewery[]) => {
    let combinedData = [...baseData]

    // Merge user-entered breweries and beers
    userData.forEach(userBrewery => {
      const existingBreweryIndex = combinedData.findIndex(brewery => brewery.id === userBrewery.id);

      if (existingBreweryIndex > -1) {
        // Brewery exists, add new beers to it
        const existingBeers = combinedData[existingBreweryIndex].beers;
        userBrewery.beers.forEach(userBeer => {
          if (!existingBeers.some(beer => beer.id === userBeer.id)) {
            // This beer doesn't exist yet, add it
            existingBeers.push(userBeer);
          }
        })
      } else {
        // New brewery, add it to the list
        combinedData.push(userBrewery)
      }
    });
    setBreweries(combinedData)
  }

   */
  const mergeBeers = (baseBeers: Beer[], userBeers: Beer[]): Beer[] => {
    let mergedBeers = baseBeers.map(baseBeer => {
      const userBeer = userBeers.find(uBeer => uBeer.id === baseBeer.id);
      return userBeer ? { ...baseBeer, ...userBeer } : baseBeer;
    });

    // Add new beers from userData that don't exist in baseBeers
    userBeers.filter(uBeer => !mergedBeers.some(mBeer => mBeer.id === uBeer.id))
        .forEach(newBeer => mergedBeers.push(newBeer));

    return mergedBeers;
  };

  const mergeData = (userData: Brewery[]) => {
    // Combine baseData and userData breweries, deduplicating and prioritizing userData
    let combinedData = baseData.map(baseBrewery => {
      const userBrewery = userData.find(uBrewery => uBrewery.id === baseBrewery.id);

      if (userBrewery) {
        // Merge beers from both sources, prioritizing userData
        const mergedBeers = mergeBeers(baseBrewery.beers, userBrewery.beers);
        return { ...baseBrewery, ...userBrewery, beers: mergedBeers };
      }

      return baseBrewery;
    });

    // Add new breweries from userData that don't exist in baseData
    userData.filter(uBrewery => !combinedData.some(cBrewery => cBrewery.id === uBrewery.id))
        .forEach(newBrewery => combinedData.push(newBrewery));

    setBreweries(combinedData);
  };


  useEffect(() => {
    // Load filters/sorts from sessionStorage, data from localStorage
    const loadedSettings = {
      searchQuery: sessionStorage.getItem('searchQuery') || '',
      showFavorites: sessionStorage.getItem('showFavorites') === 'true',
      showBeersWithoutUntappdRating: sessionStorage.getItem('showBeersWithoutUntappdRating') === 'true',
      minUntappdRating: sessionStorage.getItem('minUntappdRating') || '',
      hasUserRating: sessionStorage.getItem('hasUserRating') === 'true',
      sortOption: sessionStorage.getItem('sortOption') || 'default',
      breweryVisibility: JSON.parse(sessionStorage.getItem('breweryVisibility') || '{}'),
      userAddedData: localStorage.getItem('userAddedData')
    };
    const test = [
      {
        "id": 1,
        "beers": [
          {
            "id": 7155171,
            "name": "Testi",
            "style": "testi olut"
          }
        ]
      },
      {
        "id": 7155171,
        "name":"Testipanimo",
        "beers": [
          {
            "id": 7155171,
            "name": "Testi2",
            "style": "testi olu2t"
          }
        ]
      }
    ]
    const userAddedData = loadedSettings.userAddedData ? JSON.parse(loadedSettings.userAddedData) : []
    setUserBreweries(userAddedData)
    mergeData(userAddedData)
    setSearchQuery(loadedSettings.searchQuery);
    setShowFavorites(loadedSettings.showFavorites);
    setShowBeersWithoutUntappdRating(loadedSettings.showBeersWithoutUntappdRating)
    setMinUntappdRating(loadedSettings.minUntappdRating !== null ? loadedSettings.minUntappdRating : '');
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
        .filter(({ name, style, details, untappdRating, userData }) => {
          const searchLower = searchQuery.toLowerCase();

          // Checking if the search query matches any of the specified fields
          const matchesSearchQuery = name.toLowerCase().includes(searchLower) ||
              style?.toLowerCase().includes(searchLower) ||
              details?.toLowerCase().includes(searchLower) ||
              untappdRating?.toString().includes(searchLower) ||
              userData?.notes?.toLowerCase().includes(searchLower) ||
              userData?.userRating?.toString().includes(searchLower);
          const isFavorite = showFavorites ? userData?.favorite === true : true;
          const userRatingExists = !hasUserRating || (userData?.userRating !== undefined && userData?.userRating !== "" && userData?.userRating !== null);
          const untappdRatingCondition = showBeersWithoutUntappdRating
              ? untappdRating === '0'
              : (minUntappdRating !== '' && parseFloat(minUntappdRating) !== 0
                  ? untappdRating !== undefined && parseFloat(untappdRating) >= parseFloat(minUntappdRating)
                  : true);

          return matchesSearchQuery && isFavorite && userRatingExists && untappdRatingCondition
        })
        .sort((a, b) => {
          const aUntappdRating = parseFloat(a.untappdRating || '0');
          const bUntappdRating = parseFloat(b.untappdRating || '0');
          const aUserRating = parseFloat(a.userData?.userRating || '0');
          const bUserRating = parseFloat(b.userData?.userRating || '0');

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

  const handleUserRatingChange = (breweryId: number, beerId: number, rating: string) => {
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

  const areFiltersActive = searchQuery !== '' || showFavorites || hasUserRating || (parseFloat(minUntappdRating) !== 0) || showBeersWithoutUntappdRating;
  const visibleBreweries = areFiltersActive ? filteredAndSortedBreweries.filter(brewery => brewery.beers.length > 0) : filteredAndSortedBreweries;
  const beerCount = visibleBreweries.reduce((acc, brewery) => acc + brewery.beers.length, 0);
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  const isAnyFilterActive = searchQuery !== '' ||
      showFavorites ||
      parseFloat(minUntappdRating) > 0 ||
      hasUserRating ||
      showBeersWithoutUntappdRating

  const allBeers = breweries.flatMap(brewery =>
      brewery.beers.map(beer => ({
        brewery: brewery?.name,
        ...beer,
        userData: getUserBeerData(brewery.id, beer.id)
      }))
  );

  const topUntappdRatedBeers = allBeers
      .filter(beer => beer.untappdRating) // Filter out beers without an Untappd rating
      .sort((a, b) => parseFloat(b.untappdRating || '0') - parseFloat(a.untappdRating || '0')) // Sort by Untappd rating
      .slice(0, 10); // Get top 10

  const topUserRatedBeers = allBeers
      .filter(beer => beer.userData?.userRating) // Filter out beers without a user rating
      .sort((a, b) => parseFloat(b.userData?.userRating || '0') - parseFloat(a.userData?.userRating || '0')) // Sort by user rating
      .slice(0, 10); // Get top 10

  const generateUniqueId = (breweryId: number): number => {
    const brewery = userBreweries.find(b => b.id === breweryId);
    let highestId = 715517000000
    if (!brewery) {
      return 715517000000
    }
    brewery.beers.forEach(beer => {
      if (beer.id > highestId) highestId = beer.id;
    })

    return highestId + 1
  }

  const generateUniqueBreweryId = (): number => {
    let highestId = 715517000000
    userBreweries.forEach(brewery => {
      if (brewery.id > highestId) highestId = brewery.id
    })

    return highestId + 1
  }

  const defaultBeer = {
    "id": 715517000000,
    "name": "",
    "style": "",
    "details": "",
    "untappdRating": ""
  }

  const defaultBrewery = {
    "id": 715517000000,
    "name": "",
    "beers": [
      defaultBeer
    ]
  }

  const updateUserEditedData = (data: Brewery[]) => {
    setUserBreweries(data)
    localStorage.setItem('userAddedData', JSON.stringify(data))
    mergeData(data)
    console.log(data)
  }

  const addBeer = (breweryId: number) => {
    let breweryExists = userBreweries.some(brewery => brewery.id === breweryId);
    let updatedUserBreweries: Brewery[]

    if (!breweryExists) {
      const newBeer = { ...defaultBeer, id: generateUniqueId(breweryId) };
      const newBrewery = {
        id: breweryId,
        name: "",
        beers: [newBeer]
      };
      updatedUserBreweries = [...userBreweries, newBrewery]
    } else {
      const newUserBreweries = userBreweries.map(brewery => {
        if (brewery?.id === breweryId) {
          return {
            ...brewery,
            beers: [...brewery.beers, {...defaultBeer, id: generateUniqueId(breweryId)}]
          }
        }
        return brewery
      })
      updatedUserBreweries = newUserBreweries
    }

    updateUserEditedData(updatedUserBreweries)
  }

  const addBrewery = () => {
    const newBreweryId = generateUniqueBreweryId()

    const newBrewery: Brewery = {
      id: newBreweryId,
      name: "",
      beers: [defaultBeer]
    }

    const newUserBreweries = [...userBreweries, newBrewery]
    updateUserEditedData(newUserBreweries)
  };

  const isCustomItem = (id: number) => {
    return id.toString().startsWith("715517");
  }

  const handleBreweryNameChange = (e: React.ChangeEvent<HTMLInputElement>, breweryId: number, newName: string) => {
    e.preventDefault()
    const updatedBreweries = userBreweries.map(brewery => {
      if (brewery.id === breweryId) {
        return { ...brewery, name: newName };
      }
      return brewery;
    });
    updateUserEditedData(updatedBreweries);
  };

  const handleBeerNameChange = (breweryId: number, beerId: number, newName: string) => {
    const updatedUserBreweries = userBreweries.map(brewery => {
      if (brewery.id === breweryId) {
        const updatedBeers = brewery.beers.map(beer => {
          if (beer.id === beerId) {
            return { ...beer, name: newName };
          }
          return beer;
        });

        return { ...brewery, beers: updatedBeers };
      }
      return brewery;
    });

    updateUserEditedData(updatedUserBreweries);
  };

  const handleBeerStyleChange = (breweryId: number, beerId: number, newStyle: string) => {
    const updatedUserBreweries = userBreweries.map(brewery => {
      if (brewery.id === breweryId) {
        const updatedBeers = brewery.beers.map(beer => {
          if (beer.id === beerId) {
            return { ...beer, style: newStyle };
          }
          return beer;
        });

        return { ...brewery, beers: updatedBeers };
      }
      return brewery;
    });

    updateUserEditedData(updatedUserBreweries);
  };


  return (
      <div>
          <header>
            <h1 className="header-title">BeerNoter</h1>
          </header>
        <div id={"filters"}>
          {filtersExpanded &&
              <>
                <div className={"flex"}>
                  <input
                      type="search"
                      placeholder="Search beers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
                    <button className={searchQuery?.length > 0 ? "active" : "disabled"} disabled={!(searchQuery?.length > 0)} onClick={() => setSearchQuery('')}>
                        Clear
                    </button>
                </div>
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
                      type="text"
                      inputMode={"decimal"}
                      value={minUntappdRating}
                      onChange={(e) => {
                        const value = e.target.value.replace(",",".")
                        setMinUntappdRating(value)
                      }}
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
                  Show my ratings
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
          <small>{beerCount} beers in total</small>
          {visibleBreweries?.length < 1 &&
              <div className={"brewery-item"}>
                <h2>Fuck. No beers to show.</h2>
              </div>
          }
        {
          visibleBreweries.map(brewery => {
            const hasVisibleBeers = brewery.beers.length > 0
            const shouldShowBeers = breweryVisibility[brewery.id];

            return hasVisibleBeers && (
                    <div key={brewery.id} className={"brewery-item"}>
                      {isCustomItem(brewery.id) ? (
                          <h2 onClick={()=>toggleBreweryVisibility(brewery.id)} className={"editable"}>
                            <input
                                type="text"
                                placeholder={"Type brewery"}
                                value={brewery.name}
                                onChange={(e) => handleBreweryNameChange(e, brewery.id, e.target.value)}
                            />
                            <span>{brewery.beers.length} {brewery.beers.length > 1 ? "beers" : "beer"}</span>
                          </h2>
                          )
                      : (
                          <h2 onClick={() => toggleBreweryVisibility(brewery.id)}>{brewery.name} <span>{brewery.beers.length} {brewery.beers.length > 1 ? "beers" : "beer"}</span></h2>
                        )
                      }
                      {shouldShowBeers && brewery.beers.map(beer => {
                        const compositeKey = `${brewery.id}-${beer.id}`;
                        const userData = userBeerData[compositeKey] || {};
                        return (
                            <div key={compositeKey} className={"beer-item"}>
                              {isCustomItem(beer.id) ? (
                                      <>
                                        <h3 className={"editable"}>
                                          <input
                                              type="text"
                                              placeholder={"Type beer name"}
                                              value={beer.name}
                                              onChange={(e) => handleBeerNameChange(brewery.id, beer.id, e.target.value)}
                                              className={"editable-beer-name"}
                                          />
                                          <button onClick={() => handleFavorite(brewery.id, beer.id)} className={userData.favorite ? "starred" : ""}>
                                            {userData.favorite ? <Starred/> : <Star/>}
                                          </button>
                                        </h3>
                                        <p className={"editable"}>
                                        <input
                                            type="text"
                                            placeholder={"Type description"}
                                            value={beer.style}
                                            onChange={(e) => handleBeerStyleChange(brewery.id, beer.id, e.target.value)}
                                        />
                                        </p>
                                      </>
                                  ) : (
                                      <>
                                        <h3>
                                          <span>{beer.name}</span>
                                          <button onClick={() => handleFavorite(brewery.id, beer.id)} className={userData.favorite ? "starred" : ""}>
                                            {userData.favorite ? <Starred/> : <Star/>}
                                          </button>
                                        </h3>
                                        <p>{beer.style}</p>
                                        <p>{beer.details}</p>
                                        <p>Untappd: {beer?.untappdRating ? parseFloat(beer.untappdRating).toFixed(2) : "N/A"}</p>
                                      </>
                                  )
                              }
                              <input
                                  type="text"
                                  inputMode={"decimal"}
                                  placeholder="Rate this beer"
                                  value={userData.userRating || ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(",",".")
                                    handleUserRatingChange(brewery.id, beer.id, value)
                                  }}
                              />
                              <textarea
                                  placeholder="Add notes"
                                  rows={4}
                                  value={userData.notes || ''}
                                  onChange={(e) => handleNotesChange(brewery.id, beer.id, e.target.value)}
                              />
                            </div>
                        );
                      })}
                      {shouldShowBeers &&
                          <button className={"user-add"} onClick={()=>addBeer(brewery.id)}>
                            + add beer
                          </button>
                      }
                    </div>
                )
              }
          )
        }
        <button className={"user-add"} onClick={()=>addBrewery()}>
          + add brewery
        </button>
        </div>
        <div id={"top-lists"}>
          <div>
            <h3>My top rated</h3>
            {topUserRatedBeers?.length < 1 &&
            <p>No beers rated.</p>
            }
            <ol>
              {topUserRatedBeers.map((beer,i) => (
                  <li key={i}>
                    {beer.name} <b>{parseFloat(beer?.userData?.userRating || '0').toFixed(2)}</b><br/><small>{beer.brewery}<br/>{beer.style} {beer.details} {beer?.untappdRating ? "Untappd: " + parseFloat(beer?.untappdRating || '0').toFixed(2) : ""}</small>
                  </li>
              ))}
            </ol>
          </div>
          <div>
            <h3>Top rated on Untappd</h3>
            <ol>
              {topUntappdRatedBeers.map((beer,i)=>(
                  <li key={i}>
                    {beer.name} <b>{parseFloat(beer.untappdRating || '0').toFixed(2)}</b><br/><small>{beer.brewery}<br/>{beer.style} {beer.details} {beer?.userData?.userRating ? "My rating: " + parseFloat(beer?.userData?.userRating || '0').toFixed(2) : ""}</small>
                  </li>
              ))}
            </ol>
          </div>
        </div>
        <footer>
          © Topi Särkiniemi {new Date().getFullYear()},<br/>all rights reserved.
        </footer>
      </div>
  );
}

export default App;
