import React, { Component } from "react";
import ReactDOM from "react-dom";
import CryptoJS from 'crypto-js'
import ReactFileReader from 'react-file-reader'
import { Modal, Button, Tab, Nav, Col, Row, InputGroup, FormControl, Card } from 'react-bootstrap'
import Base64Downloader from 'react-base64-downloader'
import { SkynetClient } from "skynet-js";
import Joyride, { CallBackProps, STATUS, Step, StoreHelpers } from 'react-joyride';

class FileProcessor extends Component {
    constructor() {
        super();

        this.state = {
            showTips: false,
            TextSelectFile: "Select File",
            originalFileName: "",
            originalFileBase64: "",
            encryptedFileBase64: "",
            enPasswd: "",
            skylink: "",
            dePasswd: "",
            decryptedFileBase64: "",
            showResult: false,
            result: "NoData",
            disableDownload: true,
            downloadStatus: "No Data",
            run: true,
            steps: [
                {
                    content: <h2>Let me guide you through!</h2>,
                    placement: 'center',
                    target: 'body',
                },
                {
                    content: <h2>Intro: Encryption</h2>,
                    target: '.en-step-0',
                },
                {
                    content: <h2>Select a file you want to encrypt</h2>,
                    floaterProps: {
                        disableAnimation: true,
                    },
                    spotlightPadding: 20,
                    target: '.en-step-1',
                },
                {
                    content: <h2>Key in sharing code</h2>,
                    floaterProps: {
                        disableAnimation: true,
                    },
                    spotlightPadding: 20,
                    target: '.en-step-2',
                },
                {
                    content: <h2>Click to encrypt</h2>,
                    floaterProps: {
                        disableAnimation: true,
                    },
                    spotlightPadding: 20,
                    target: '.en-step-3',
                },
                {
                    content: <h2>Result will be generated here, sample: skylink: https://siasky.net/XAGEzqYP2q3cPquOoqBuHi--GfH41pvHygv7Ok6DWA1mgg/ with sharing code: 123</h2>,
                    floaterProps: {
                        disableAnimation: true,
                    },
                    spotlightPadding: 20,
                    target: '.en-step-4',
                },
                {
                    content: <h2>For Decryption, simply provide skylink and the sharing code to decrypt</h2>,
                    target: '.de-step-0',
                }
            ]
        };
    }

    data2File = (data) => {
        return new File([data], "encrypted_" + this.state.originalFileName, { type: "text/plain" })
    }
    dataURL2File = (dataurl, filename) => {

        var arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
    }

    handleClose = () => {
        this.setState({ showTips: false })
    }

    reset = () => {
        this.setState({
            TextSelectFile: "Select File",
            originalFileName: "",
            originalFileBase64: "",
            encryptedFileBase64: "",
            enPasswd: "",
            skylink: "",
            dePasswd: "",
            showResult: false,
            result: "NoData",
            disableDownload: true,
            downloadStatus: "No Data"
        })
    }

    handleSelectFileChange = (files) => {
        console.log(files.fileList)

        if (files.fileList.length < 1) {
            this.reset();
            this.setState({ showTips: true, tips: "nothing selected!" })
            return;
        } else if (files.fileList.length > 1) {
            this.reset();
            this.setState({ showTips: true, tips: "one file each time!" })
            return;
        }

        this.setState({
            TextSelectFile: files.fileList[0].name,
            originalFileName: files.fileList[0].name,
            originalFileBase64: files.base64
        })

        console.log("originalFileBase64:")
        console.log(this.state.originalFileBase64)


    }

    handleEnPasswordChange = (val) => {
        this.setState({ enPasswd: val })
    }
    handleDePasswordChange = (val) => {
        this.setState({ dePasswd: val })
    }
    handleSkylinkChange = (val) => {
        this.setState({ skylink: val })
    }

    onUploadProgress = (progress, { loaded, total }) => {
        console.info(`Progress ${Math.round(progress * 100)}%`)
    }

    upload2skynet = async (file) => {
        try {
            const client = new SkynetClient("https://siasky.net");
            const { skylink } = await client.upload(file, (progress, { loaded, total }) => {
                console.info(`Progress ${Math.round(progress * 100)}%`);
            })

            console.log("skylink:" + skylink)
            var result = "skylink: https://siasky.net/" + skylink + " with Decrption code: " + this.state.enPasswd
            this.setState({
                showResult: true,
                result: result
            })
        } catch (error) {
            console.log(error);
        }
    }

    downloadFromSkynet = (skylink) => {
        try {
            const client = new SkynetClient("https://siasky.net");
            client.download(skylink);
        } catch (error) {
            console.log(error);
            this.setState({ showTips: true, tips: "Download Error:" + error.toString() })
        }
    }


    handleEncryption = () => {
        var encryptedFileBase64 = CryptoJS.AES.encrypt(this.state.originalFileBase64, this.state.enPasswd).toString()

        this.setState({
            encryptedFileBase64: encryptedFileBase64
        }, () => {
            console.log("encryptedFileBase64:")
            console.log(this.state.encryptedFileBase64)

            var encryptedFile = this.data2File(this.state.encryptedFileBase64)

            this.upload2skynet(encryptedFile)
        })

    }
    handleDecryption = () => {
        //downloadFromSkynet(this.state.skylink)
        this.setState({
            showResult: true,
            result: "processing..."
        })
        fetch(this.state.skylink)
            .then((response) => {
                return response.text();
            })
            .then(data => {
                try {
                    var encryptedFileBase64 = data
                    console.log(encryptedFileBase64)

                    var bytes = CryptoJS.AES.decrypt(encryptedFileBase64, this.state.dePasswd)
                    var originalText = bytes.toString(CryptoJS.enc.Utf8)

                    this.setState({ decryptedFileBase64: originalText })

                    this.setState({
                        showTips: true,
                        tips: "ready to download, please click the download button!",
                        disableDownload: false,
                        downloadStatus: "Click To Download!"
                    })

                    console.log("originalText:")
                    console.log(originalText)
                } catch (error) {
                    console.log(error);
                    this.setState({ showTips: true, tips: "Decryption Error:" + error.toString() + " ! make sure the password is correct" })
                }
            }
            );
    }

    getHelpers = (helpers: StoreHelpers) => {
        this.helpers = helpers;
    }
    handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            this.setState({ run: false });
        }

        // tslint:disable:no-console
        console.groupCollapsed(type);
        console.log(data);
        console.groupEnd();
        // tslint:enable:no-console
    }

    render() {
        const { run, steps } = this.state;
        return (
            <>
                <Joyride
                    callback={this.handleJoyrideCallback}
                    continuous={true}
                    getHelpers={this.getHelpers}
                    run={run}
                    scrollToFirstStep={true}
                    showProgress={true}
                    showSkipButton={true}
                    steps={steps}
                    styles={{
                        options: {
                            zIndex: 10000,
                        },
                    }}
                />
                <h1 style={{ 'text-align': 'center' }}>POC For Hackathon: Private Info Generator</h1>
                <div class="container-fluid mt-5">
                    <Tab.Container id="left-tabs-example" defaultActiveKey="first">
                        <Row>
                            <Col sm={3}>
                                <Nav variant="pills" className="flex-column">
                                    <Nav.Item>
                                        <Nav.Link eventKey="first" className="en-step-0">Encryption</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="second" className="de-step-0">Decryption</Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>
                            <Col sm={9}>
                                <Tab.Content>
                                    <Tab.Pane eventKey="first">
                                        <div class="container-fluid">
                                            <div class="input-group-sm">
                                                <ReactFileReader base64={true} handleFiles={this.handleSelectFileChange}>
                                                    <button class="browse-btn btn btn-block btn-secondary btn-sm en-step-1">{this.state.TextSelectFile}</button>
                                                </ReactFileReader>
                                            </div>
                                            <div class="">
                                                <InputGroup className="mb-3 en-step-2">
                                                    <InputGroup.Prepend>
                                                        <InputGroup.Text id="basic-addon1">Encryption Code:</InputGroup.Text>
                                                    </InputGroup.Prepend>
                                                    <FormControl
                                                        value={this.state.enPasswd} ref={input => this.inputEnPassword = input} onChange={e => this.handleEnPasswordChange(e.target.value)}
                                                        placeholder="Keyin Encryption Code"
                                                        aria-label="EnPassword"
                                                        aria-describedby="basic-addon1"
                                                    />
                                                </InputGroup>
                                                <button type="button" class="btn btn-sm btn-primary encrypt en-step-3" onClick={this.handleEncryption}>Encrypt</button>
                                            </div>
                                            <Card show={this.state.showResult} className="en-step-4" border="primary" bg="success" text="dark">
                                                <Card.Header>Encryption Result</Card.Header>
                                                <Card.Body>
                                                    <Card.Title>Copy and Share/Save the generated info below::</Card.Title>
                                                    <Card.Text>{this.state.result}</Card.Text>
                                                </Card.Body>
                                            </Card>
                                            <div class="input-group-sm">
                                                <a href="javascript:void(0)" class="reset btn btn-block btn-danger" onClick={this.reset}>Reset</a>
                                            </div>
                                        </div>

                                    </Tab.Pane>
                                    <Tab.Pane eventKey="second">
                                        <div class="container-fluid">
                                            <div class="input-group-sm de-step-1">
                                                <InputGroup className="mb-3">
                                                    <InputGroup.Prepend>
                                                        <InputGroup.Text id="basic-addon1">SkynetLink:</InputGroup.Text>
                                                    </InputGroup.Prepend>
                                                    <FormControl
                                                        value={this.state.skylink} ref={input => this.inputSkylink = input} onChange={e => this.handleSkylinkChange(e.target.value)}
                                                        placeholder="Paste Skynet Link"
                                                        aria-label="SkynetLink"
                                                        aria-describedby="basic-addon1"
                                                    />
                                                </InputGroup>
                                            </div>
                                            <div class="">
                                                <InputGroup className="mb-3 de-step-2">
                                                    <InputGroup.Prepend>
                                                        <InputGroup.Text id="basic-addon1">Decryption Code:</InputGroup.Text>
                                                    </InputGroup.Prepend>
                                                    <FormControl
                                                        value={this.state.dePasswd} ref={input => this.inputDePassword = input} onChange={e => this.handleDePasswordChange(e.target.value)}
                                                        placeholder="Keyin Decryption Code"
                                                        aria-label="DePassword"
                                                        aria-describedby="basic-addon1"
                                                    />
                                                </InputGroup>
                                                <button type="button" class="btn btn-sm btn-primary decrypt de-step-3" onClick={this.handleDecryption}>Decrypt</button>
                                            </div>
                                            <Base64Downloader disabled={this.state.disableDownload} className="btn btn-sm btn-success de-step-4" base64={this.state.decryptedFileBase64} downloadName="decrypted">
                                                {this.state.downloadStatus}
                                            </Base64Downloader>
                                            <div class="input-group-sm">
                                                <a href="javascript:void(0)" class="reset btn btn-block btn-danger" onClick={this.reset}>Reset</a>
                                            </div>
                                        </div>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Col>
                        </Row>
                    </Tab.Container>


                    <Modal show={this.state.showTips}>
                        <Modal.Header closeButton>
                            <Modal.Title>Modal heading</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>{this.state.tips}</Modal.Body>
                        <Modal.Footer>
                            <Button variant="primary" onClick={this.handleClose}>Close</Button>
                        </Modal.Footer>
                    </Modal>
                </div>
            </>
        )
    }
}

export default FileProcessor;