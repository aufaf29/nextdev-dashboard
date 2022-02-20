
function activate() {
    modal.toggle();
}

function setCountry(name, close=true) {
    $("#selected-country-name").text(name);
    $(".choosen-flag").attr("src", `https://countryflagsapi.com/png/${name}`);
    localStorage.setItem("country", JSON.stringify({
        "name": name
    }))
    
    if (close) {
        modal.hide();
        $("#grid-container").addClass("loading-skeleton");
        $("#chart").empty();
        createVisualization(name);
    } 


}

function getCountry() {
    return JSON.parse(localStorage.getItem("country"))
}

function countUp(target, value) {


    if (isNaN(value)) {
        target.text("No Data");
    } else {

        const formatter = new Intl.NumberFormat('id-ID')
        
        const duration = 2000;
        const frameduration = 1000 / 60;
        const frametotal = Math.round( duration / frameduration );
        
        let frame = 0;
        
        const counter = setInterval( () => {
    
            frame++;
            const current = Math.round(value * Math.pow(frame / frametotal, 1/5));
            target.text(formatter.format(current));
            
            if ( frame === frametotal ) clearInterval( counter );
            
        }, frameduration );    
    }
    
}

function setupOptions(series) {
    return {
        series: [
            {
                name: 'Penambahan Kasus (+)',
                data: series,
                color:'#000000'
            }
        ],
        chart: {
            type: 'area',
            stacked: false,
            height: 300,
            zoom: {
                type: 'x',
                enabled: true,
                autoScaleYaxis: true
            },
            toolbar: {
                autoSelected: 'zoom'
            }
        },
        dataLabels: {
            enabled: false
        },
        markers: {
            size: 0,
        },
        title: {
            text: 'Grafik Penambahan Kasus Harian',
            align: 'center',
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                inverseColors: true,
                opacityFrom: 0.75,
                opacityTo: 0,
                stops: [0, 90, 100]
            },
        },
        yaxis: {
            labels: {
                formatter: function (val) {
                    return (val).toFixed(0);
                },
            },
            title: {
                text: 'Penambahan Kasus (+) Harian'
            },
        },
        xaxis: {
            type: 'datetime',
        },
        tooltip: {
            shared: true,
            y: {
                formatter: function (val) {
                    return (val).toFixed(0)
                }
            }
        }
    };
}


function createVisualization(country) {
    const settings = {
        "async": true,
        "crossDomain": true,
        "url": `https://covid-193.p.rapidapi.com/history?country=${country == "Brunei Darussalam" ? "Brunei" : country}`,
        "method": "GET",
        "headers": {
            "x-rapidapi-host": "covid-193.p.rapidapi.com",
            "x-rapidapi-key": "fc8b75d5bbmshb7a8f76bcbec73dp184815jsnc6f35c7294b1"
        }
    };
    
    $.ajax(settings).done(function (response) {

        
        // create daily series data for chart
        let series = []
        let data = response.response;
        let last = 0;

        data.forEach(e => {
            let cases = e.cases.new;
            let date = new Date(e.day).getTime();

            if(cases != null) {
                let increment = parseInt(cases.replace(/\+/g, ''));
                if(last != date) {
                    series.push([date, increment]);
                    last = date;
                }
            }
        });
        
        // set 2000 ms timeout for skeleton loading animation
        setTimeout(function() {
            
            $("#grid-container").removeClass("loading-skeleton");
            
            // render chart
            var chart = new ApexCharts(document.querySelector("#chart"), setupOptions(series));
            chart.render();
        
            countUp($("#cases-total"), parseInt(data[0].cases.total));
            countUp($("#cases-new"), parseInt(data[0].cases.new.replace(/\+/g, '')));
            countUp($("#cases-active"), parseInt(data[0].cases.active));
            countUp($("#cases-active-critical"), parseInt(data[0].cases.critical));
            countUp($("#cases-recovered"), data[0].cases.recovered);
            countUp($("#cases-death"), data[0].deaths.total);
            countUp($("#cases-death-new"), parseInt(data[0].deaths.new.replace(/\+/g, '')));
            countUp($("#total-test"), data[0].tests.total);

            // get today and yesterday data
            let stop = false;
            let i = 1;
            let now = data[0];
            let yesterday = data[1];
            while (!stop) {
                if (now.day != data[i].day) {
                    yesterday = data[i];
                    stop = true;
                }
                i++;
            }
            
            let new_active = parseInt(now.cases.active) - parseInt(yesterday.cases.active);
            let new_active_critical = parseInt(now.cases.critical) - parseInt(yesterday.cases.critical);
            let recovered = parseInt(now.cases.recovered) - parseInt(yesterday.cases.recovered);
            let new_test = parseInt(now.tests.total) - parseInt(yesterday.tests.total);

            // change up sign when value is negative
            if (new_active < 0) {
                new_active = 0 - new_active
                $("#sign").removeClass("bx-chevrons-up")
                $("#sign").addClass("bx-chevrons-down")
            } else {
                $("#sign").removeClass("bx-chevrons-down")
                $("#sign").addClass("bx-chevrons-up")
            }

            // change up sign when value is negative
            if (new_active_critical < 0) {
                new_active_critical = 0 - new_active_critical
                $("#sign-critical").removeClass("bx-chevrons-up")
                $("#sign-critical").addClass("bx-chevrons-down")
            } else {
                $("#sign-critical").removeClass("bx-chevrons-down")
                $("#sign-critical").addClass("bx-chevrons-up")
            }
            
            // update daily increase information
            countUp($("#cases-active-new"), new_active);
            countUp($("#cases-active-critical-new"), new_active_critical);
            countUp($("#cases-recovered-new"), recovered);
            countUp($("#total-test-new"), new_test);
        
        }, 2000);
    });
}




let asean = ["Indonesia", "Malaysia", "Singapore", "Brunei Darussalam", "Thailand", "Philippines", "Laos", "Cambodia", "Myanmar", "Vietnam"]
let modal = new bootstrap.Modal($('#chooser-modal'), { keyboard: false })


$(document).ready(() => {
    
    // check country data in local storage
    let country = getCountry();

    // if no data, choose Indonesia
    if (country == null) {
        setCountry("Indonesia", close=false);
    } else {
        setCountry(country.name, close=false);
    }

    // set image for country options
    asean.forEach((e) => {
        $(".countries").append(`
           <div class="flag-image" onclick="setCountry('${e}')">
               <img class="flag-style" src="https://countryflagsapi.com/png/${e}" alt="${e}">
               <div class="text-center country-name animate__animated animate__fadeIn">${e}</div>
           </div>`
        );
    });

    console.log(country)

    createVisualization(country.name);

    

}); 



