import React, { Component } from "react";
import ReactDOM from "react-dom";
import CryptoJS from 'crypto-js'
import ReactFileReader from 'react-file-reader'
import { Modal, Button, Tab, Nav, Col, Row, InputGroup, FormControl } from 'react-bootstrap'
import Base64Downloader from 'react-base64-downloader'
import { SkynetClient } from "skynet-js";

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
            decryptedFileBase64: ""
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
            dePasswd: ""
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
            this.setState({ showTips: true, tips: "Download Error:"+error.toString() })
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

            // var originalText = this.handleDecryption()
            // var decryptedFile = this.dataURL2File(originalText, this.state.originalFileName)
            // console.log(decryptedFile)
        })


        // fileReader = new FileReader()
        // fileReader.onload = (event) => {
        //     console.log("filereader onload")
        //     console.log(event.target.result)
        //     encryptedFile = CryptoJS.AES.encrypt(event.target.result, password);
        //     downloadButton.setAttribute('href', 'data:application/octet-stream,' + encryptedFile);
        //     downloadButton.setAttribute('download', file.name + '.encrypted');
        // }
        // fileReader.readAsDataURL(this.state.originalFile)
    }
    handleDecryption = () => {
        //downloadFromSkynet(this.state.skylink)

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

                    this.setState({ showTips: true, tips: "ready to download, please click the download button!" })

                    console.log("originalText:")
                    console.log(originalText)
                } catch (error) {
                    console.log(error);
                    this.setState({ showTips: true, tips: "Decryption Error:"+error.toString()+" ! make sure the password is correct" })
                }
            }
            );
    }

    render() {
        return (
            <>
                <div class="container-fluid">
                    <Tab.Container id="left-tabs-example" defaultActiveKey="first">
                        <Row>
                            <Col sm={3}>
                                <Nav variant="pills" className="flex-column">
                                    <Nav.Item>
                                        <Nav.Link eventKey="first">Encryption</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="second">Decryption</Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>
                            <Col sm={9}>
                                <Tab.Content>
                                    <Tab.Pane eventKey="first">
                                        <div class="container-fluid">
                                            <div class="input-group-sm">
                                                <ReactFileReader base64={true} handleFiles={this.handleSelectFileChange}>
                                                    <button class="browse-btn btn btn-block btn-secondary btn-sm">{this.state.TextSelectFile}</button>
                                                </ReactFileReader>
                                            </div>
                                            <div class="">
                                                <InputGroup className="mb-3">
                                                    <InputGroup.Prepend>
                                                        <InputGroup.Text id="basic-addon1">Password:</InputGroup.Text>
                                                    </InputGroup.Prepend>
                                                    <FormControl
                                                        type="password"
                                                        value={this.state.enPasswd} ref={input => this.inputEnPassword = input} onChange={e => this.handleEnPasswordChange(e.target.value)}
                                                        placeholder="Keyin Encryption Password"
                                                        aria-label="EnPassword"
                                                        aria-describedby="basic-addon1"
                                                    />
                                                </InputGroup>
                                                <button type="button" class="btn btn-sm btn-primary encrypt" onClick={this.handleEncryption}>Encrypt</button>
                                            </div>
                                            <div class="input-group-sm">
                                                <a href="javascript:void(0)" class="reset btn btn-block btn-danger" onClick={this.reset}>Reset</a>
                                            </div>
                                        </div>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="second">
                                        <div class="container-fluid">
                                            <div class="input-group-sm">
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
                                                <InputGroup className="mb-3">
                                                    <InputGroup.Prepend>
                                                        <InputGroup.Text id="basic-addon1">Password:</InputGroup.Text>
                                                    </InputGroup.Prepend>
                                                    <FormControl
                                                        type="password"
                                                        value={this.state.dePasswd} ref={input => this.inputDePassword = input} onChange={e => this.handleDePasswordChange(e.target.value)}
                                                        placeholder="Keyin Decryption Password"
                                                        aria-label="DePassword"
                                                        aria-describedby="basic-addon1"
                                                    />
                                                </InputGroup>
                                                <button type="button" class="btn btn-sm btn-primary decrypt" onClick={this.handleDecryption}>Decrypt</button>
                                            </div>
                                            <Base64Downloader class="btn btn-sm btn-success" base64={this.state.decryptedFileBase64} downloadName="decrypted">
                                                Click to download
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