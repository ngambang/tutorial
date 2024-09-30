let localStream;
let peerConnection;
let websocket;

const configuration = { iceServers: [] }; // Tidak menggunakan STUN server

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

startButton.addEventListener('click', startConnection);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);

async function startConnection() {
    try {
        websocket = new WebSocket('ws://' + window.location.hostname + ':8080');
        websocket.onmessage = handleSignalingMessage;

        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        startButton.disabled = true;
        callButton.disabled = false;
    } catch (error) {
        console.error('Error starting connection:', error);
    }
}

function call() {
    createPeerConnection();
    
    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
            sendMessage({ type: 'offer', offer: peerConnection.localDescription });
        })
        .catch(error => console.error('Error creating offer:', error));

    callButton.disabled = true;
    hangupButton.disabled = false;
}

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);
    
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            sendMessage({ type: 'candidate', candidate: event.candidate });
        }
    };

    peerConnection.ontrack = event => {
        console.log('Received remote track');
        if (remoteVideo.srcObject !== event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
            console.log('Set remote video stream');
        }
    };

    peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
    };

    peerConnection.onsignalingstatechange = () => {
        console.log('Signaling state:', peerConnection.signalingState);
    };
}

function handleSignalingMessage(event) {
    const message = JSON.parse(event.data);
    console.log('Received message:', message);

    switch(message.type) {
        case 'offer':
            handleOffer(message.offer);
            break;
        case 'answer':
            handleAnswer(message.answer);
            break;
        case 'candidate':
            handleCandidate(message.candidate);
            break;
        default:
            console.log('Unknown message type:', message.type);
    }
}

async function handleOffer(offer) {
    if (!peerConnection) {
        createPeerConnection();
    }

    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendMessage({ type: 'answer', answer: peerConnection.localDescription });
    } catch (error) {
        console.error('Error handling offer:', error);
    }
}

async function handleAnswer(answer) {
    try {
        if (peerConnection.signalingState !== 'stable') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } else {
            console.log('Connection is already stable, ignoring answer');
        }
    } catch (error) {
        console.error('Error handling answer:', error);
    }
}

function handleCandidate(candidate) {
    if (peerConnection && peerConnection.remoteDescription) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(error => console.error('Error adding ICE candidate:', error));
    } else {
        console.log('Received ICE candidate before remote description, ignoring');
    }
}

function sendMessage(message) {
    if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open, unable to send message');
    }
}

function hangup() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    remoteVideo.srcObject = null;
    callButton.disabled = false;
    hangupButton.disabled = true;
    sendMessage({ type: 'hangup' });
}

// Memastikan video lokal selalu ditampilkan
localVideo.onloadedmetadata = () => {
    localVideo.play().catch(error => console.error('Error playing local video:', error));
};