# Carbstatus redirect: A cloudflare worker that adds carbstatus index data to your urls

## How it works

If the client carbstatus index is below 50, the worker will add a `save-data=1` query param to your redirect URL.

Test it now: [https://redirect.carbstatus.workers.dev?r=https://example.org](https://redirect.carbstatus.workers.dev?r=https://example.org)

Replace `https://example.org` with your desired redirect URL

## Why?

This enables carbon-awareness on your apps and servers.

If the request URL contains the 'save-data' param you can:

- reduce the data size and/or data crunching server-side
- reduce the number of requests client-side (react app, etc) with pure CSS

See this example:
```html

<script>
	if (/save-data=1/.test(window.location.search)){
		document.head.classList.add('save-data')
	}
</script>

<style>
    /**Remove background images */
.save-data img{
	background-image: none; 

    /**Switch to local fonts instead of downloading... */

.save-data body{
	font-family: 'Arial';
}
</style>

```
