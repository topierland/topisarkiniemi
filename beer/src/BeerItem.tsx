import React, {useState} from "react";
import {DeleteButton, DynamicInput} from "./uielements";
import { ReactComponent as Star } from './star.svg'
import { ReactComponent as Starred } from './starred.svg'

interface BeerItemProps {
    compositeKey: string;
    isCustomItem: (id: number) => boolean;
    beer: {
        id: number;
        name: string;
        style: string;
        details?: string;
        untappdRating?: string;
    };
    userData: {
        favorite?: boolean;
        userRating?: string;
        notes?: string;
    };
    handleBeerNameChange: (breweryId: number, beerId: number, value: string) => void;
    handleFavorite: (breweryId: number, beerId: number) => void;
    brewery: {
        id: number;
    };
    handleUserRatingChange: (breweryId: number, beerId: number, value: string) => void;
    handleNotesChange: (breweryId: number, beerId: number, value: string) => void;
    removeBeer: (breweryId: number, beerId: number) => void;
    handleBeerStyleChange: (breweryId: number, beerId: number, value: string) => void;
}

export const BeerItem: React.FC<BeerItemProps> = ({compositeKey, isCustomItem, beer, userData, handleBeerNameChange, handleFavorite, brewery, handleUserRatingChange, handleNotesChange, removeBeer, handleBeerStyleChange}) => {
    const [showBeerRater, setShowBeerRate] = useState(false)

    return <React.Fragment key={compositeKey}>
        <div className={"beer-item"}>
            {isCustomItem(beer.id) ? (
                <>
                    <h3 className={"editable"}>
                        <DynamicInput
                            height={22}
                            placeholder={"Type beer name"}
                            value={beer.name}
                            onChange={(value) => handleBeerNameChange(brewery.id, beer.id, value)}
                        />
                        <button onClick={() => handleFavorite(brewery.id, beer.id)} className={userData.favorite ? "starred" : ""}>
                            {userData.favorite ? <Starred/> : <Star/>}
                        </button>
                    </h3>
                    <p className={"editable"}>
                        <DynamicInput
                            height={18.5}
                            placeholder={"Type description"}
                            value={beer.style}
                            onChange={(value) => handleBeerStyleChange(brewery.id, beer.id, value)}
                        />
                    </p>
                </>
            ) : (
                <>
                    <h3 id={`${brewery?.id}.${beer?.id}`}>
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
            {showBeerRater ?
                <>
                    <input
                        type="text"
                        inputMode={"decimal"}
                        placeholder="Rate this beer"
                        value={userData.userRating || ''}
                        autoFocus={!(userData?.userRating && !userData?.notes) || true}
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
                        autoFocus={(userData?.userRating && !userData?.notes) || false}
                    />
                    <button className={"filter-toggle"} onClick={()=>setShowBeerRate(false)}>Done</button>
                </> : (userData?.userRating || userData?.notes) ?
                    <>
                        <br/>
                        <p>My rating: {userData?.userRating || '-'}</p>
                        <p>Notes: {userData?.notes || '-'}</p>
                        <button className={"edit-button"} onClick={()=>setShowBeerRate(true)}>^ edit</button>
                    </> :
                    <button className={"edit-button"} onClick={()=>setShowBeerRate(true)}># rate</button>
            }

        </div>
        {isCustomItem(beer.id) &&
            <DeleteButton onDelete={() => removeBeer(brewery.id, beer.id)} />
        }
    </React.Fragment>
}