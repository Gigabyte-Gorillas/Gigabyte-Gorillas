import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Alert, Text, View, Dimensions, StyleSheet, TouchableHighlight } from 'react-native';
import { bindActionCreators } from 'redux';
import Camera from 'react-native-camera';
import { ActionCreators } from './../Actions/ActionCreators';
import { Icon} from 'native-base';


class Cam extends Component {

  componentWillMount() {
    this.props.fetchUser(this.props.user.user.id);
  }

  render() {
    return (
      <View style={styles.container}>
        <Camera
          ref={(cam) => {
            this.camera = cam;
          }}
          captureTarget={Camera.constants.CaptureTarget.memory}
          style={styles.preview}
          aspect={Camera.constants.Aspect.fill}>
          <Text style={styles.capture} onPress={this.takePicture.bind(this)}><Icon name="camera" /></Text>
        </Camera>
      </View>
    );
  }

  takePicture() {
    let options = {};
    console.log('');
    this.camera.capture({metadata: options})
    .then((data) => {
      Alert.alert('Got Photo!');
      let sendData = Object.assign({}, this.props.user, {
        data: data
      });

      this.props.sendPhoto(sendData);

      this.props.incrementPhotoCount();
      console.log('sendData: ', sendData);
      console.log('taking photo');

      // //
      // // let postData = data;
      // // postData['id_users'] = ''; // ADD USER ID HERE
      // // postData['id_habits'] = []; // array of USER HABIT DATA HERE
      // fetch('http://192.168.1.5:8080/api/dates', {
      //   method: 'POST',
      //   headers: {
      //     'Accept': 'application/json',
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(postData)
      // })
      // .then((data) => console.log('picture res from server data:', data))
      // .catch((err) => console.log('Send error', err))
    })
    .catch(err => console.error(err));
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    color: '#000',
    padding: 10,
    margin: 40
  }
});

const mapStateToProps = (state) => {
  return {
    user: state.user.userData
  }
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActionCreators, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Cam);
