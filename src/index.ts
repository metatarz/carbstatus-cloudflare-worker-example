export default {
	/**
	 *	IMPORTANT: All requests must contain the "r" query param with the desired URL to redirect the requests to.

		If the carbstatus index for the client ip is below the THRESHOLD, this script will add:
			1)save-data=1 in URL search params

		This allows you to:
			1) reduce the data size and/or data crunching in your server-side
			2) reduce the number of requests client-side (react app, etc) with pure CSS

		For example: 

		<script>
			if (/save-data=1/.test(window.location.search)){
				document.head.classList.add('save-data')
			}
		</script>

		and in your css code:

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

			const ip = request.headers.get('cf-connecting-ip');
			const fetchCarbstatusData = (url: string) => {
				return fetch(`${CARBSTATUS_API_ENDPOINT}/index-by-ip?i=${ip}`);
			};

			const url = new URL(request.url);
			let redirectUrl: string;
			if (url.searchParams && url.searchParams.get('r')) {
				redirectUrl = url.searchParams.get('r')!;
			} else {
				return new Response('Bad Request: missing r query param (redirect URL to) ');
			}

			// Call carbstatus API and check whether to add the save-data flag
			let addSaveDataHeader: boolean;
			const resp = await fetchCarbstatusData(redirectUrl);
			if (resp && resp.ok) {
				const data: IIndexData = await resp.json();
				addSaveDataHeader = data.nvalue <= SAVE_DATA_THRESHOLD;
			} else {
				//bad request or location not found
				console.error(`[CarbStatus]: Error status code ${resp.status}`);
				addSaveDataHeader = false;
			}

			const newUrl = new URL(redirectUrl);

			if (addSaveDataHeader) {
				newUrl.searchParams.append(SAVE_DATA_CLASSNAME, '1');
			}

			// redirect call with modified searchParams
			return Response.redirect(newUrl.toString());
		} catch (err) {
			console.log(err);
			return new Response('Internal Error');
		}
	},
};
