var loadedCSV = {data:[]};

// searching productions
var Productions = [];
var Results = [];
var FinalResults = [];

// searching performers
var PerformerProductionToResults = {};

var searchingPerformers = false;

var productionsTemplate = `
    <% for (production of productionResults) { %>
        <a href="#" onclick="showProductionTours('<%= production.replaceAll("'", "&apos;") %>');return false;"><%= production %></a>
        <br>
    <% } %>
`;

var performerProductionsTemplate = `
    <% for (production of productionResults) { %>
        <a href="#" onclick="showPerformerProductionResults('<%= production.replaceAll("'", "&apos;") %>');return false;"><%= production %></a>
        (<%= productionToResults[production].length %>)
<br>
    <% } %>
`;

var recordingTemplate = `
    <% for(recording of results) { %>
        <% var video = (recording.video == '1' ? "video" : "audio"); %>
        <% var nft = (recording.nft_forever == '1' ? "Yes" : "No"); %>
        <% var nfs = (recording.is_nfs == '1' ? "Yes" : "No"); %>
        <% var showCast = (recording.cast != '' ? recording.cast : recording.raw_cast); %>
        <b><%= recording.production %> - <%= recording.tour %> - <%= recording.date_nice %><%= recording.extras %> (<%= recording.master %>'s <%= video %> master)</b>
        <br>
        <% if (recording.location != "") { %>
            <i><%= recording.location %></i>
            <br>
        <% } %>
        <b>CAST: </b><%= showCast %>
        <br>
        <b>NOTES: </b> <%= recording.notes %><br>
        <b>NFT Date: </b> <%= recording.nft_date %>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <b>NFT Forever? </b> <%= nft %>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <b>NFS? </b> <%= nfs %>
        <% if (recording.raw_cast != "") { %>
            <br>
            <a href="#" onclick="var x = document.getElementById('<%= 'rawcast' + recording.recording_id %>');
                if (x.style.display === 'none') {
                    x.style.display = 'inline';
                  } else {
                    x.style.display = 'none';
                  }; return false;">
            <b>Raw Cast:</b></a>
            <span id='<%= 'rawcast' + recording.recording_id %>' style='display: none;'>&nbsp;<%- recording.raw_cast %></span>
        <% } %>
        <% if (recording.mediainfo) { %>
            <br>
            <a href="#" onclick="var x = document.getElementById('<%= 'mediainfo' + recording.recording_id %>');
                if (x.style.display === 'none') {
                    x.style.display = 'block';
                  } else {
                    x.style.display = 'none';
                  }; return false;">
            <b>Mediainfo: </b></a>
            <span id='<%= 'mediainfo' + recording.recording_id %>' style='display: none;'><%- recording.mediainfo.replaceAll("\\n","<br>") %></span>
        <% } %>
        <% if (recording.original_date != "") { %>
            <br>
            <a href="#" onclick="var x = document.getElementById('<%= 'date' + recording.recording_id %>');
                if (x.style.display === 'none') {
                    x.style.display = 'inline';
                  } else {
                    x.style.display = 'none';
                  }; return false;">
            <b>Raw Date:</b></a>
            <span id='<%= 'date' + recording.recording_id %>' style='display: none;'>&nbsp;<%- recording.original_date %></span>
        <% } %>

        <% if (recording['Added By']) { %>
            <br>
            <b>Added By:</b> <%= recording['Added By'] %>
        <% } %>

        <% if (recording.Notes) { %>
            <br>
            <b>Edit Notes:</b> <%= recording.Notes %>
        <% } %>

        <hr>
    <% } %>
`;

// var titleTemplate = `
// There are actually two different titleTemplates that we use
// in showProductionTours() and showTourResults()

var titleTemplate1 = `
    <h1> <%- production %> </h1>
`;
var titleTemplate2 = `
    <a href="#" onclick="showProductionTours('<%= production.replaceAll("'", "&apos;") %>');return false;"><h1> <%= production %> </h1></a>
    <h2> <%= tour %> </h2>
`;

var toursTemplate = `
    <% for (tour of tours) { %>
       <a href="#" onclick="searchInTour('<%= production.replaceAll("'", "&apos;") %>', '<%= tour && tour.replaceAll("'", "&apos;") %>');return false;"><%= tour %></a>
        (<%= results[tour].length %>)
        <br>
    <% } %>
`;

function keypress(e) {
    if (event.key === 'Enter') {
        if (e.id === 'searchBox') {
            search();
        } else if (e.id == 'performerSearchBox') {
            searchPerformers();
        }
    }
}

// search for production titles that contain the search term, render a clickable list of productions
function search() {
    searchingPerformers = false;

    var searchTerm = document.getElementById("searchBox").value;
    // remove punctuation from search term
    searchTerm = searchTerm.replace(/[\.,-\/#!$%\^\*;:{}=\-_`~()"'¡]/gi, '').toLowerCase();

    var productionResults = [];
    for (production of Productions) {
        if (production) {
            var productionNoPunctuation = production.replace(/[\.,-\/#!$%\^\*;:{}=\-_`~()"'¡]/gi, '').toLowerCase();
            if (productionNoPunctuation.includes(searchTerm)) {
                productionResults.push(production);
            }
        }
    }

    if (productionResults.length <= 0) {
        document.getElementById("showResults").innerHTML = "No productions founds :(";
        document.getElementById("resultsTitle").innerHTML = "";
        return;
    }

    var productionsHtml = ejs.render(productionsTemplate, {
        productionResults: productionResults
    });

    document.getElementById("showResults").innerHTML = productionsHtml;
    document.getElementById("resultsTitle").innerHTML = "";
}

// search all casts for this string (note: doesn't just search performer names, also character names)
function searchPerformers() {
    searchingPerformers = true;

    var searchTerm = document.getElementById("performerSearchBox").value;
    searchTerm = searchTerm.replace(/[\.,-\/#!$%\^\*;:{}=\-_`~()"'ยก]/gi, '').toLowerCase();

    Results = []
    for (recording of loadedCSV.data) {
        if (recording) {
            var cast_to_search = (recording.cast != '' ? recording.cast : recording.raw_cast);
            if (!cast_to_search) {
                continue;
            }
            cast_to_search = cast_to_search.replace(/[\.,-\/#!$%\^\*;:{}=\-_`~()"'ยก]/gi, '').toLowerCase();
            if (cast_to_search.includes(searchTerm)) {
                addRecordingExtras(recording);
                Results.push(recording);
            }
        }
    }

    if (Results.length <= 0) {
        document.getElementById("showResults").innerHTML = "No results found :(";
        document.getElementById("resultsTitle").innerHTML = "";
        return;
    }

    //            showPerformerResults(true, true);
    buildPerformerProductionToResults();
    showPerformerProductions();
}

// build a map of production -> recordings for all the recording Results for this perfomer
function buildPerformerProductionToResults() {
    PerformerProductionToResults = {};
    for (recording of Results) {
        if (recording && recording.production) {
            var production = recording.production;
            if (!PerformerProductionToResults[production]) {
                PerformerProductionToResults[production] = [];
            }

            PerformerProductionToResults[production].push(recording);
        }
    }
}

// show a list of all Productions that have performance casts matching the performer search
function showPerformerProductions() {
    var productionResults = Object.keys(PerformerProductionToResults);

    if (productionResults.length <= 0) {
        document.getElementById("showResults").innerHTML = "No results founds :(";
        document.getElementById("resultsTitle").innerHTML = "";
        return;
    }

    var productionsHtml = ejs.render(performerProductionsTemplate, {
        productionResults: productionResults,
        productionToResults: PerformerProductionToResults
    });

    document.getElementById("showResults").innerHTML = productionsHtml;
    document.getElementById("resultsTitle").innerHTML = "";
}

// search for all tours of production, render a clickable list of tours
function showProductionTours(production) {
    Results = {};
    var tours = new Set();
    //            var production;
    for (recording of loadedCSV.data) {
        if (recording.production && production && recording.production.toLowerCase().replaceAll("'", "&apos;") == production.toLowerCase()) {
            if (!tours.has(recording.tour)) {
                tours.add(recording.tour);
                Results[recording.tour] = [];
            }
            Results[recording.tour].push(recording);
            tours.add(recording.tour);
        }
    }
    if (tours.size <= 0) {
        document.getElementById("showResults").innerHTML = "No tours found :(";
        document.getElementById("resultsTitle").innerHTML = "";
        return;
    }

    tours = Array.from(tours).sort();

    var toursHtml = ejs.render(toursTemplate, {
        tours: tours,
        production: production,
        results: Results
    });

    var titleHtml = ejs.render(titleTemplate1, {
        production: production
    })

    document.getElementById("showResults").innerHTML = toursHtml;
    document.getElementById("resultsTitle").innerHTML = titleHtml;
}

// search for all recordings of tour, render a list of recordings
function searchInTour(production, tour) {
    // console.log(tour);
    // console.log(production);
    FinalResults = Results[tour.replaceAll("&apos;", "'")];
    for (recording of FinalResults) {
        addRecordingExtras(recording);
    }

    showTourResults(true, true);
}

function showResults(videos, audios) {
    if (videos && audios) {
        document.getElementById("showAll").setAttribute("aria-pressed", true);
        document.getElementById("showVideosOnly").setAttribute("aria-pressed", false);
        document.getElementById("showAudiosOnly").setAttribute("aria-pressed", false);
    } else if (videos) {
        document.getElementById("showAll").setAttribute("aria-pressed", false);
        document.getElementById("showVideosOnly").setAttribute("aria-pressed", true);
        document.getElementById("showAudiosOnly").setAttribute("aria-pressed", false);
    } else if (audios) {
        document.getElementById("showAll").setAttribute("aria-pressed", false);
        document.getElementById("showVideosOnly").setAttribute("aria-pressed", false);
        document.getElementById("showAudiosOnly").setAttribute("aria-pressed", true);
    }
    if (searchingPerformers) {
        showPerformerResults(videos, audios);
    } else {
        showTourResults(videos, audios);
    }
}

// render list of recordings
function showTourResults(videos, audios) {
    var renderResults = filterAndSortResults(videos, audios);

    var titleHtml = ejs.render(titleTemplate2, {
        results: renderResults,
        production: FinalResults[0].production,
        tour: FinalResults[0].tour
    });

    var resultsHtml = ejs.render(recordingTemplate, {
        results: renderResults,
        production: FinalResults[0].production,
        tour: FinalResults[0].tour
    });

    document.getElementById("showResults").innerHTML = resultsHtml;
    document.getElementById("resultsTitle").innerHTML = titleHtml;
}

// show list of recordings for this performer + production
function showPerformerProductionResults(production) {
    FinalResults = PerformerProductionToResults[production.replaceAll("&apos;", "'")];
    if (FinalResults) {
        showPerformerResults(true, true);
    }
}

function showPerformerResults(videos, audios) {
    var renderResults = filterAndSortResults(videos, audios);

    var resultsHtml = ejs.render(recordingTemplate, {
        results: renderResults
    });

    document.getElementById("showResults").innerHTML = resultsHtml;
    document.getElementById("resultsTitle").innerHTML = "";
}

function filterAndSortResults(vid, aud) {
    FinalResults.sort((a, b) => ((a.production.localeCompare(b.production)) ||
        (a.tour.localeCompare(b.tour)) ||
        (a.date.localeCompare(b.date))));

    var res = FinalResults;

    // filter out videos/audios
    if (!vid) {
        res = res.filter(recording => recording.video != '1');
    }
    if (!aud) {
        res = res.filter(recording => recording.video == '1');
    }

    return res;
}

// some extra formatting etc for a recording
function addRecordingExtras(recording) {

    recording.extras = "";
    if (recording.matinee == "1") {
        recording.extras += " (Matinee)";
    }
    if (recording.is_closing == "1") {
        recording.extras += " (Closing Night)";
    }
    if (recording.is_opening == "1") {
        recording.extras += " (Opening Night)";
    }
    if (recording.is_preview == "1") {
        recording.extras += " (Preview)";
    }
    if (recording.highlights == "1") {
        recording.extras += " (Highlights)";
    }

    // nice date if full date is known
    try {
        var date = new Date(recording.date);
        if (recording.day_not_known != "1") {
            var options = {
                weekday: undefined,
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC'
            };
            recording['date_nice'] = date.toLocaleDateString("en-US", options);
            recording['original_date'] = recording.date;
        } else {
            recording['date_nice'] = recording.date;
            recording['original_date'] = recording.date;
            // replace date with 1st of month/year for sorting purposes
            recording['date'] = date.toISOString().split('T')[0];
        }
    } catch (err) {
        // something went wrong with date formatting, just leave it...
        // console.log(err);
    }
}

async function fetchSheetsData() {
    try {
        return await (await fetch("/api/sheets")).json();
    } catch (e) {
        alert (e);
    }
}
