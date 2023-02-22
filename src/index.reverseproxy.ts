export default {
	/**
	 *	IMPORTANT: All requests must contain the "r" query param with the desired URL to redirect the requests to.
	 	Warning: Relative links will fail to resolve.

		If the carbstatus index for the client ip is below the THRESHOLD, this script will add:
			1)save-data HTTP Response header
			2)save-data classname to html files

		1) Allows you to reduce the data size and/or data crunching in your server-side
		2) Allows you to reduce the number of requests client-side (react app, etc) with pure CSS. 

		For example, in your css files:

		.save-data img{
			background-image: none; 
		}

		.save-data body{
			font-family: 'Arial';
		}
	*/
	async fetch(request: Request) {
		try {
			interface IIndexData {
				time: number;
				nvalue: number;
				value: number;
			}
			const SAVE_DATA_CLASSNAME = 'save-data';
			const SAVE_DATA_THRESHOLD = 50;
			const CARBSTATUS_API_ENDPOINT = 'https://api.carbstatus.info/v1';

			class ClassAppender {
				shouldAddSaveDataHeader = false;
				constructor(shouldAddSaveDataHeader: boolean) {
					this.shouldAddSaveDataHeader = shouldAddSaveDataHeader;
				}
				element(element: HTMLElement) {
					if (this.shouldAddSaveDataHeader) {
						element.setAttribute(
							'class',
							`${element.getAttribute('class') ?? ''} ${SAVE_DATA_CLASSNAME}`
						);
					}
				}
			}

			const ip = request.headers.get('cf-connecting-ip');
			const fetchCarbstatusData = (url: string) => {
				return fetch(`${CARBSTATUS_API_ENDPOINT}/index?l=${url}${ip ? `&i=${ip}` : ''}`);
			};

			// Reverse proxy: Redirect the request to the one provided in the 'r' query param
			const url = new URL(request.url);
			let redirectUrl: string;
			if (url.searchParams && url.searchParams.get('r')) {
				redirectUrl = url.searchParams.get('r')!;
				url.href = redirectUrl;
			}

			// Call carbstatus API and check whether to add the save-data flag
			let addSaveDataHeader: boolean;
			const resp = await fetchCarbstatusData(url.href);
			if (resp && resp.ok) {
				const data: IIndexData = await resp.json();
				addSaveDataHeader = data.nvalue <= SAVE_DATA_THRESHOLD;
			} else {
				//bad request or location not found
				console.error(`[CarbStatus]: Error status code ${resp.status}`);
				addSaveDataHeader = false;
			}

			const newHdrs = new Headers(request.headers);
			if (addSaveDataHeader) {
				newHdrs.set('Save-Data', 'on');
			}
			// call origin server with modified headers
			let res = await fetch(url.toString(), {
				method: request.method,
				headers: newHdrs,
			});
			const contentType = res.headers.get('Content-Type');

			// If the response is HTML, it can be transformed with
			// HTMLRewriter -- otherwise, it should pass through
			if (contentType?.startsWith('text/html')) {
				// Append the save-data class to the html element
				const rewriter = new HTMLRewriter().on('html', new ClassAppender(addSaveDataHeader));
				res = rewriter.transform(res);
			}
			const text = await res.text();

			const newRespHdrs = new Headers(res.headers)

			if (addSaveDataHeader){
				newRespHdrs.set('Save-Data', 'on');
			}

			// Add save-data HTTP Response header
			return new Response(text, {
				status: res.status,
				statusText: res.statusText,
				headers: newRespHdrs,
			});
		} catch (err) {
			console.log(err);
			return new Response('Internal Error');
		}
	},
};
