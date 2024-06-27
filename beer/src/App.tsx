import React, {useEffect, useRef, useState} from 'react';
import './App.scss';
import baseData from './data/untappd.json';
import {DeleteButton, DynamicInput} from "./uielements";
import {BeerItem} from "./BeerItem";
import DownloadButton from "./DownloadUserContent";

interface Beer {
  id: number;
  name: string;
  style: string;
  details: string;
  untappdRating?: string;
  untappdUrl?: string;
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
  const [hiddenBreweries, setHiddenBreweries] = useState<Record<number, boolean>>({});

  const toggleHideBrewery = (breweryId: number) => {
    setHiddenBreweries(prevState => ({
      ...prevState,
      [breweryId]: !prevState[breweryId],
    }));
  };

  const handleHideBrewery = (breweryId: number) => {
    if (window.confirm("Hide brewery? You can restore hidden breweries from 'filters & sorting'.")) {
      toggleHideBrewery(breweryId);
    }
  };

  const mergeBeers = (baseBeers: Beer[], userBeers: Beer[]): Beer[] => {
    const updatedBeers = baseBeers.map(baseBeer => {
      const userBeer = userBeers.find(uBeer => uBeer.id === baseBeer.id);
      return userBeer ? { ...baseBeer, ...userBeer } : baseBeer;
    });

    // Add new beers from userData that don't exist in baseBeers
    const newBeers = userBeers.filter(uBeer => !baseBeers.some(bBeer => bBeer.id === uBeer.id));

    return [...updatedBeers, ...newBeers];
  };

  const mergeData = (userData: Brewery[]) => {
    let combinedData: Brewery[] = [...baseData];

    // Update existing breweries with user data
    combinedData = combinedData.map(baseBrewery => {
      const userBrewery = userData.find(uBrewery => uBrewery.id === baseBrewery.id);
      if (userBrewery) {
        // Merge beers, prioritize user modifications
        const mergedBeers = mergeBeers(baseBrewery.beers, userBrewery.beers);
        // Keep base brewery details, only update beers
        return { ...baseBrewery, beers: mergedBeers };
      }
      return baseBrewery;
    });

    // Append new user breweries not in baseData
    const newUserBreweries = userData.filter(uBrewery => !combinedData.some(cBrewery => cBrewery.id === uBrewery.id));
    combinedData = [...combinedData, ...newUserBreweries];

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
      hiddenBreweries: JSON.parse(localStorage.getItem('hiddenBreweries') || '{}'),
      userAddedData: localStorage.getItem('userAddedData')
    };

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
    setHiddenBreweries(loadedSettings.hiddenBreweries);
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
    localStorage.setItem('hiddenBreweries', JSON.stringify(hiddenBreweries));
  }, [searchQuery, showFavorites, minUntappdRating, hasUserRating, sortOption, showBeersWithoutUntappdRating, breweryVisibility, hiddenBreweries]);

  const getUserBeerData = (breweryId: number, beerId: number): UserBeerData | undefined => {
    const compositeKey = `${breweryId}-${beerId}`;
    return userBeerData[compositeKey];
  }

  const filteredBreweries = breweries.filter(brewery => !hiddenBreweries[brewery.id]);

  const filteredAndSortedBreweries = filteredBreweries.map(brewery => ({
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
    saveUserDataToLocalStorage(updatedData);
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

  const handleBeerClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, breweryId: number, beerId: number) => {
    e.preventDefault(); // Prevent the default anchor click behavior

    // Ensure the brewery is visible
    if (!breweryVisibility[breweryId]) {
      toggleBreweryVisibility(breweryId);
    }

    // Delay scrolling to the element to ensure it's rendered
    setTimeout(() => {
      const element = document.getElementById(`${breweryId}.${beerId}`);
      if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - 175, // Sticky element height
          behavior: 'smooth'
        });
      }
    }, 0);
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

  const allBeers = filteredBreweries.flatMap(brewery =>
      brewery.beers.map(beer => ({
        breweryId: brewery?.id,
        brewery: brewery?.name,
        ...beer,
        userData: getUserBeerData(brewery.id, beer.id)
      }))
  );

  const [untappdAmount, setUntappdAmount] = useState(10)
  const [userAmount, setUserAmount] = useState(10)

  const untappdRatedBeers = allBeers
      .filter(beer => beer.untappdRating) // Filter out beers without an Untappd rating

  const topUntappdRatedBeers = untappdRatedBeers
      .sort((a, b) => parseFloat(b.untappdRating || '0') - parseFloat(a.untappdRating || '0')) // Sort by Untappd rating
      .slice(0, untappdAmount); // Get top 10

  const userRatedBeers = allBeers
      .filter(beer => beer.userData?.userRating && !isNaN(parseFloat(beer.userData?.userRating || '')))// Filter out beers without a user rating

  const topUserRatedBeers = userRatedBeers
      .sort((a, b) => parseFloat(b.userData?.userRating || '0') - parseFloat(a.userData?.userRating || '0')) // Sort by user rating
      .slice(0, userAmount); // Get top 10

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
    "untappdRating": "",
    "untappdUrl": ""
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

  const handleBreweryNameChange = ( newName: string, breweryId: number,) => {
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

  const removeBeer = (breweryId: number, beerId: number) => {
    const updatedUserBreweries = userBreweries.reduce<Brewery[]>((acc, brewery) => {
      if (brewery.id === breweryId) {
        const updatedBeers = brewery.beers.filter(beer => beer.id !== beerId);

        // If it's a user-added brewery and no more beers are left, don't add the brewery back
        if (brewery.id.toString().startsWith("715517") && updatedBeers.length === 0) {
          return acc;
        }
        // Otherwise, update the brewery's beers and add it back
        acc.push({ ...brewery, beers: updatedBeers });
      } else {
        acc.push(brewery);
      }
      return acc;
    }, []);

    updateUserEditedData(updatedUserBreweries);
  };

  const clearHiddenBreweries = () => {
    if (window.confirm("Do you want to restore all hidden breweries?")) {
      setHiddenBreweries({});
    }
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
                <div className={"flex"}>
                  <label>
                    <input
                        type="checkbox"
                        checked={showFavorites}
                        onChange={(e) => setShowFavorites(e.target.checked)}
                    />
                    Show Starred
                  </label>
                  <button
                      className={Object.keys(hiddenBreweries).length === 0 ? "disabled margin-left-auto" : "active margin-left-auto"}
                      disabled={Object.keys(hiddenBreweries).length === 0}
                      onClick={clearHiddenBreweries}
                  >
                    Restore hidden breweries
                  </button>
                </div>
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
                            <DynamicInput
                                placeholder={"Type brewery"}
                                value={brewery.name}
                                height={27.5}
                                onChange={(value) => handleBreweryNameChange(value, brewery.id)}
                            />
                            <span>{brewery.beers.length} {brewery.beers.length > 1 ? "beers" : "beer"}</span>
                          </h2>
                          )
                      : (
                          <h2 onClick={() => toggleBreweryVisibility(brewery.id)}>{brewery.name} <span>{brewery.beers.length} {brewery.beers.length > 1 ? "beers" : "beer"}</span></h2>
                        )
                      }
                      {shouldShowBeers &&
                          <button onClick={() => handleHideBrewery(brewery.id)}>- hide brewery</button>
                      }
                      {shouldShowBeers && brewery.beers.map(beer => {
                        const compositeKey = `${brewery.id}-${beer.id}`;
                        const userData = userBeerData[compositeKey] || {};
                        return (
                            <BeerItem
                                compositeKey={compositeKey}
                                brewery={brewery}
                                beer={beer}
                                userData={userData}
                                handleBeerNameChange={handleBeerNameChange}
                                handleFavorite={handleFavorite}
                                handleUserRatingChange={handleUserRatingChange}
                                handleNotesChange={handleNotesChange}
                                removeBeer={removeBeer}
                                handleBeerStyleChange={handleBeerStyleChange}
                                isCustomItem={isCustomItem}
                            />
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
                    <a href={`#${beer.breweryId}.${beer.id}`} onClick={(e) => handleBeerClick(e, beer.breweryId, beer.id)}>{beer.name} <b>{parseFloat(beer?.userData?.userRating || '0').toFixed(2)}</b></a><br/><small>{beer.brewery}<br/>{beer.style} {beer.details} {beer?.untappdRating ? "Untappd: " + parseFloat(beer?.untappdRating || '0').toFixed(2) : ""}</small>
                  </li>
              ))}
              {userRatedBeers?.length > userAmount &&
                  <button onClick={()=>setUserAmount(untappdAmount + 5)}>+ Show more</button>
              }
            </ol>
          </div>
          <div>
            <h3>Top rated on Untappd</h3>
            <ol>
              {topUntappdRatedBeers.map((beer,i)=>(
                  <li key={i}>
                    <a href={`#${beer.breweryId}.${beer.id}`} onClick={(e) => handleBeerClick(e, beer.breweryId, beer.id)}>{beer.name} <b>{parseFloat(beer.untappdRating || '0').toFixed(2)}</b></a><br/><small>{beer.brewery}<br/>{beer.style} {beer.details} {beer?.userData?.userRating ? "My rating: " + parseFloat(beer?.userData?.userRating || '0').toFixed(2) : ""}</small>
                  </li>
              ))}
              {untappdRatedBeers?.length > untappdAmount &&
                  <button onClick={()=>setUntappdAmount(untappdAmount + 5)}>+ Show more</button>
              }
            </ol>
          </div>
        </div>
        <DownloadButton allBeers={allBeers} userBeerData={userBeerData} />
        <footer>
          © Topi Särkiniemi {new Date().getFullYear()},<br/>all rights reserved.
        </footer>
      </div>
  );
}

export default App;
