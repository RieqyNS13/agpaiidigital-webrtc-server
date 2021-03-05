

module.exports = async function (server, { mediasoupObj }) {
    // const fs = require("fs");
    const io = require("socket.io")(server, {
        allowEIO3: true, // false by default
        cors: {
            origin: true,
            credentials: true,
        },
    });
    // var jwt = require("@ardatamedia/ardata-jsonwebtoken");
    // var cert = fs.readFileSync("oauth-public.key"); // get public key

    //https://socket.io/docs/v2/migrating-from-0-9/index.html
    // io.use(socketioJwt.authorize({
    //     secret: 'RM0SqcmpoatgzQ5JXi6aeEXYI6dSaPiWDSbTW79s',
    //     // secret: 'YXp3YXI=',
    //     handshake: true
    //   }));
    // io.use((socket, next) => {
    //     if (socket.handshake.query.token) next();
    //     else {
    //         const err = new Error("not authorized");
    //         err.data = { content: "JWT harus diisi" }; // additional details
    //         next(err);
    //     }
    // });
    // io.use((socket, next) => {
    //     try {
    //         const token = socket.handshake.query.token;
    //         const decoded_token = jwt.verify(token, cert, { algorithms: ["RS256"] });
    //         socket.decoded_token = decoded_token;
    //         socket.jwt = socket.handshake.query.token;
    //         console.log("[Auth] success auth from user_id:", decoded_token.sub);
    //         next();
    //     } catch (err) {
    //         // console.log('auth vailed');
    //         // console.log();
    //         if (process.env.APP_DEV) console.log('[Auth] Failed: ', err);
    //         next(err);
    //     }
    // });

    io.on("connection", (socket) => {
        socket.on("test", (data) => {
            console.log("[test] data:", data);
            // console.log(mediasoupObj.mediasoupRouter);
            // io.to(socket.id).emit("test",mediasoupObj.mediasoupRouter);
        });
        socket.on("getRouterRtpCapabilities", (data, callback) => {
            console.log("[getRouterRtpCapabilities] ");
            // io.emit(mediasoupObj.router.rtpCapabilities);
            callback(mediasoupObj.router.rtpCapabilities);


        });
        socket.on('createProducerTransport', async (data, callback) => {
            console.log("[createProducerTransport] ");
            try {
                const { transport, params } = await mediasoupObj.createWebRtcTransport();
                console.log('[params producer]',params);

                mediasoupObj.producerTransport = transport;
                callback(params);
            } catch (err) {
                console.error(err);
                callback({ error: err.message });
            }
        });
        socket.on('createConsumerTransport', async (data, callback) => {
            console.log("[createConsumerTransport] ");
            try {
                const { transport, params } = await mediasoupObj.createWebRtcTransport();
                console.log('[params consumer]',params);

                mediasoupObj.consumerTransport = transport;
                callback(params);
            } catch (err) {
                console.error(err);
                callback({ error: err.message });
            }
        });
        socket.on('connectProducerTransport', async (data, callback) => {
            console.log("[connectProducerTransport] ");
            await mediasoupObj.producerTransport.connect({ dtlsParameters: data.dtlsParameters });
            callback();
        });

        socket.on('connectConsumerTransport', async (data, callback) => {
            console.log("[connectConsumerTransport] ");
            await mediasoupObj.consumerTransport.connect({ dtlsParameters: data.dtlsParameters });
            callback();
        });

        socket.on('produce', async (data, callback) => {
            console.log("[produce] ");
            const { kind, rtpParameters } = data;
            mediasoupObj.producer = await mediasoupObj.producerTransport.produce({ kind, rtpParameters });
            callback({ id: mediasoupObj.producer.id });

            // inform clients about new producer
            socket.broadcast.emit('newProducer');
        });

        socket.on('consume', async (data, callback) => {
            // console.log("[consume] ");
            console.log("[consume] ",mediasoupObj.producer);
            callback(await mediasoupObj.createConsumer(mediasoupObj.producer, data.rtpCapabilities));
        });

        socket.on('resume', async (data, callback) => {
            console.log("[resume] ");
            await mediasoupObj.consumer.resume();
            callback();
        });
    });



    return io;
};

