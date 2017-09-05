Ics-proxy - make your Time Edit schedule more personal
======

Ics-proxy is a service that rewrites the otherwise non-legible Time Edit schedules whilst still keeping the ability to automatically update the schedules via subscription.

Live<sup>1</sup> over at: https://ics-proxy-pzzyoonoil.now.sh

[before]: https://github.com/AlexGustafsson/ics-proxy/raw/master/assets/before.png "Before"

[after]: https://github.com/AlexGustafsson/ics-proxy/raw/master/assets/after.png "After"

[before-detail]: https://github.com/AlexGustafsson/ics-proxy/raw/master/assets/before-detail.png "Before detail"

[after-detail]: https://github.com/AlexGustafsson/ics-proxy/raw/master/assets/after-detail.png "After detail"

| Before        | After       |
| ------------- |-------------|
| ![Before][before] | ![After][after] |
| ![Before detail][before-detail] | ![After detail][after-detail] |

# Quickstart
<a name="quickstart"></a>


#### Installation
Right now ics-proxy is not intended to be a "single click" experience. Prerequisites are NodeJS & NPM. Built for NodeJS v7.4.0.

Clone the project
```
git clone https://github.com/AlexGustafsson/ics-proxy
```
Navigate to the folder
```
cd ics-proxy
```
Start the service
```
npm start
```

# Table of contents

[Quickstart](#quickstart)<br/>
[Usage](#usage)<br/>
[Contributing](#contributing)

# Usage
<a name="usage"></a>
Ics-proxy is primarily accessible via a web interface. This web interface is by default available at `localhost:3000`.

Navigating to the web interface will display basic instructions.

To use the proxy, simply navigate to Time Edit and prepare your search query. When you have selected the courses you want, press the "Prenumerera" button. Copy the url and paste it after the url of ics-proxy. For example `localhost:3000/time-edit-url`.

The proxy is also available<sup>1</sup> over here: https://ics-proxy-pzzyoonoil.now.sh. You can browse to `/_src` to display the full source of the project.

# Contributing
<a name="contributing"></a>

Any help with the project is more than welcome. When in doubt, post an issue.

<sup>1. The service may be shut down from time to time. If you cannot enter the site, try again after a few minutes.</sup>
