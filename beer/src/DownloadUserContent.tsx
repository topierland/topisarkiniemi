import React from 'react';

interface Beer {
    breweryId: number;
    brewery: string;
    id: number;
    name: string;
    style: string;
    details: string;
    untappdRating?: string;
}

interface UserBeerData {
    [key: string]: {
        userRating?: string;
        favorite?: boolean;
        notes?: string;
    };
}

interface DownloadButtonProps {
    allBeers: Beer[];
    userBeerData: UserBeerData;
}

const ascii = `
 @@@@@ @@@@@ @@@@@ @@@@@@ @@@@@   @@@@ @@    @@@@@ @@@@@ 
 @@@@@ @@@@@ @@@@@ @@@@@@ @@@@@ @@@@@@ @@@@@ @@@@@ @@@@@ 
 @@ @@ @@ @@ @@ @@ @@@ @@ @@ @@ @@ @@@ @@    @@ @@ @@ @@ 
 @@ @@ @@ @@ @@ @@ @@@ @@ @@ @@ @@ @@@ @@ @@ @@ @@ @@ @@ 
 @@ @@ @@ @@ @@ @@ @@@ @@ @@ @@ @@ @@@ @@ @@ @@ @@ @@ @@ 
 @@ @@ @@ @@ @@ @@ @@@ @@ @@ @@ @@ @@@ @@ @@ @@ @@ @@ @@ 
 @@ @@ @@ @@ @@ @@ @@@ @@ @@ @@ @@ @@@ @@ @@ @@ @@ @@ @@ 
 @@@@  @@ @@ @@ @@ @@@ @@ @@ @@ @@ @@@ @@ @@ @@ @@ @@ @@ 
 @@@@@ @@    @@    @@@ @@ @@ @@ @@ @@@ @@ @@ @@    @@ @@ 
 @@ @@ @@@@@ @@@@@ @@@@@  @@ @@ @@ @@@ @@ @@ @@@@@ @@@@  
 @@ @@ @@    @@    @@@ @@ @@ @@ @@ @@@ @@ @@ @@    @@ @@ 
 @@@@  @@@@@ @@@@@ @@@ @@ @@ @@ @@@@@  @@@@@ @@@@@ @@ @@ 
`

const generateDownloadContent = (allBeers: Beer[], userBeerData: UserBeerData, format: 'txt' | 'md') => {
    let content = '';

    // Filter userBeerData for entries with userRating or notes
    Object.keys(userBeerData).forEach((key) => {
        const { userRating, notes } = userBeerData[key];
        if (userRating || notes) {
            const [breweryId, beerId] = key.split('-').map(Number);
            const beer = allBeers.find(b => b.breweryId === breweryId && b.id === beerId);

            if (beer) {
                if (format === 'md') {
                    content += `### ${beer.name}${userRating ? ` – **${userRating}**` : ' – N/A'}\n`;
                    content += `${beer.brewery}\\\n`;
                    content += `${beer.style}\\\n`;
                    content += `${beer.details}\\\n`;
                    content += `Untappd: ${beer.untappdRating || 'N/A'}\n\n`;
                    if (notes) content += `**Notes:** ${notes}\n`;
                    content += `\n---\n\n`;
                } else {
                    content += `${beer.name}${userRating ? ` – ${userRating}` : ' – N/A'}\n`;
                    content += `${beer.brewery}\n`;
                    content += `${beer.style}\n`;
                    content += `${beer.details}\n`;
                    content += `Untappd: ${beer.untappdRating || 'N/A'}\n\n`;
                    if (notes) content += `Notes: ${notes}\n`;
                    content += `\n------------------\n\n`;
                }
            }
        }
    });

    content += `${ascii}\n`

    return content;
};

const downloadFile = (content: string, fileName: string, fileType: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: fileType });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
};

const DownloadButton: React.FC<DownloadButtonProps> = ({ allBeers, userBeerData }) => {
    const handleDownload = (format: 'txt' | 'md') => {
        const content = generateDownloadContent(allBeers, userBeerData, format);
        const fileName = format === 'md' ? 'beernoter.md' : 'beernoter.txt';
        const fileType = 'text/plain'
        downloadFile(content, fileName, fileType);
    };

    const hasNotesOrRatings = () => {
        return Object.values(userBeerData).some(data => data?.notes || data?.userRating);
    };


    return <div className={"download"}>
        <h3>Download My Ratings & Notes</h3>
        <div className={"buttons"}>
            <button className={"filter-toggle"} onClick={() => handleDownload('txt')} disabled={!hasNotesOrRatings()}>
                .txt
            </button>
            <button className={"filter-toggle"} onClick={() => handleDownload('md')} disabled={!hasNotesOrRatings()}>
                .md
            </button>
        </div>
    </div>
};

export default DownloadButton;
