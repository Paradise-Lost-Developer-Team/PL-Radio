import SpotifyWebApi from 'spotify-web-api-node';
import config from './config.json';

const spotifyApi = new SpotifyWebApi({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret,
    redirectUri: config.spotify.redirectUri
});

// Client Credentials Flow でアクセストークンを取得する関数
async function updateAccessToken() {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        const newToken = data.body['access_token'];
        spotifyApi.setAccessToken(newToken);
        console.log('アクセストークンが更新されました:', newToken);
    } catch (error) {
        console.error('アクセストークンの取得中にエラーが発生しました', error);
    }
}

// 初回トークン取得
updateAccessToken();

// 45分ごとにアクセストークンを更新する
setInterval(updateAccessToken, 2700000);

export default spotifyApi;
