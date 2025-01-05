import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Modal } from 'react-native';

interface DeclarationModalProps {
  visible: boolean;
  onDeclare: (declaration: number) => void;
  maxDeclaration: number;
}

export const DeclarationModal: React.FC<DeclarationModalProps> = ({
  visible,
  onDeclare,
  maxDeclaration,
}) => {
  const [declaration, setDeclaration] = useState('');

  const handleDeclare = () => {
    const declaredNumber = parseInt(declaration, 10);
    if (isNaN(declaredNumber) || declaredNumber < 0 || declaredNumber > maxDeclaration) {
      alert(`Please enter a valid number between 0 and ${maxDeclaration}`);
      return;
    }
    onDeclare(declaredNumber);
    setDeclaration('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Declare your Sirs</Text>
          <TextInput
            style={styles.input}
            onChangeText={setDeclaration}
            value={declaration}
            keyboardType="numeric"
            placeholder={`Enter a number (0-${maxDeclaration})`}
          />
          <Button title="Declare" onPress={handleDeclare} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    width: 200,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

