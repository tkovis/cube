deploy:
	ssh root@cube.tkovis.com 'cd cube; git checkout .; git pull; npm ci; npm run build; npm run prod';