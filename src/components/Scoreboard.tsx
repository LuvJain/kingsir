import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Player } from '../models/Player';

interface ScoreboardProps {
  players: Player[];
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ players }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TouchableOpacity 
      style={[styles.container, isExpanded && styles.expandedContainer]} 
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={1}
    >
      {!isExpanded ? (
        <View style={styles.collapsedView}>
          <Text style={styles.headerText}>View Scoreboard</Text>
          <Text style={styles.subtitle}>Tap to expand</Text>
        </View>
      ) : (
        <ScrollView style={styles.scoreboardContent}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Scoreboard</Text>
            <Text style={styles.subtitle}>Tap to collapse</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, styles.playerColumn]}>Player</Text>
              <Text style={[styles.columnHeader, styles.numberColumn]}>Round</Text>
              <Text style={[styles.columnHeader, styles.numberColumn]}>Bid</Text>
              <Text style={[styles.columnHeader, styles.numberColumn]}>Won</Text>
              <Text style={[styles.columnHeader, styles.numberColumn]}>Score</Text>
            </View>
            {players.map((player, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.cell, styles.playerColumn]}>{player.name}</Text>
                <Text style={[styles.cell, styles.numberColumn]}>-</Text>
                <Text style={[styles.cell, styles.numberColumn]}>{player.declaredSirs === -1 ? '?' : player.declaredSirs}</Text>
                <Text style={[styles.cell, styles.numberColumn]}>{player.wonSirs}</Text>
                <Text style={[styles.cell, styles.numberColumn]}>{player.score}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#f5e6d3', // Warm parchment
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    padding: 12,
    zIndex: 1000,
    borderWidth: 2,
    borderColor: '#d4a574',
  },
  expandedContainer: {
    width: '90%',
    height: '60%',
    right: '5%',
  },
  collapsedView: {
    alignItems: 'center',
    padding: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#d4a574',
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#2c1810',
  },
  subtitle: {
    fontSize: 12,
    color: '#8b6f47',
    marginTop: 4,
    fontWeight: '500',
  },
  scoreboardContent: {
    flex: 1,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#d4a574',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8dcc8',
  },
  columnHeader: {
    fontWeight: 'bold',
    color: '#2c1810',
    fontSize: 13,
  },
  cell: {
    color: '#2c1810',
    fontSize: 14,
  },
  playerColumn: {
    flex: 2,
    paddingRight: 10,
  },
  numberColumn: {
    flex: 1,
    textAlign: 'center',
  },
});

