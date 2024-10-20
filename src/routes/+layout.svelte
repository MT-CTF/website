<header
	class="content"
	style=" height: 40px;  margin-bottom: 24px; display: grid; grid-template-columns: auto /*1fr*/;"
>
	<a
		href="https://ctf.rubenwardy.com"
		style="display:inline-block; margin: 0px auto/*24px*/"
	>
		<img
			style="max-height: 40px; width: auto;"
			alt="Capture The Flag"
			src="https://github.com/MT-CTF/capturetheflag/blob/master/menu/header.png?raw=true"
		/>
	</a>

	<!-- <nav
		style="display: flex; flex-direction: row; align-items: center; margin: 0px 24px;"
	>
		<a href=".">Home</a>
	</nav> -->
</header>

<slot />

<footer>
	<ul>
		<li>
			<p>&copy; 2022-2024 the CaptureTheFlag Team.</p>
			<a href="https://github.com/MT-CTF/website">Website Source (MIT)</a>
		</li>
		<li>
			<p>Images from the</p>
			<a href="https://github.com/MT-CTF/capturetheflag/tree/master/menu"
				>CaptureTheFlag Github Repository</a
			>
		</li>
	</ul>
</footer>

<style>
	header {
		width: 100%;
	}

	header a {
		display: block;
	}

	nav a:not(:first-of-type) {
		margin-left: 24px;
	}

	nav a {
		font-family: "SimpleSquare", sans-serif;
		font-size: larger;
		text-decoration: none;
	}

	nav a:hover {
		text-decoration: underline;
	}

	footer {
		width: 100%;

		margin-top: auto;
		background: var(--background-color);

		border-top: 2px var(--background-border-color) solid;
		border-radius: 3px;

		line-height: 1.5rem;
	}

	footer ul {
		list-style-type: none;
		text-align: center;
	}

	footer ul li * {
		display: inline;
	}
</style>
