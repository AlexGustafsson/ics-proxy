Ics-proxy - make your Time Edit schedule more personal
======

Ics-proxy is a service that rewrites the otherwise non-legible Time Edit schedules whilst still keeping the ability to automatically update the schedules via subscription.

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

#### Docker

Clone the project
```
git clone https://github.com/AlexGustafsson/ics-proxy
```
Navigate to the folder
```
cd ics-proxy
```
Build the image
```
docker build -t axgn/ics-proxy .
```
Start the container (port 3000 is exposed, bind it to host's 3000)
```
docker run -p 3000:3000 axgn/ics-proxy
```

#### Installation (NodeJS)

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

# Contributing
<a name="contributing"></a>

Any help with the project is more than welcome. When in doubt, post an issue.
