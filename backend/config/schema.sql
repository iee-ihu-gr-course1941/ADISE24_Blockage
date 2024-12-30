-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: blokus_game
-- ------------------------------------------------------
-- Server version	8.0.40
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `games` (
  `game_id` int NOT NULL AUTO_INCREMENT,
  `created_by` int DEFAULT NULL,
  `status` enum('initialized','started','ended','aborted') NOT NULL DEFAULT 'initialized',
  `max_number_of_players` enum('2','4') NOT NULL,
  `player_turn` int DEFAULT NULL,
  `last_update_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`game_id`),
  KEY `created_by` (`created_by`),
  KEY `player_turn` (`player_turn`),
  CONSTRAINT `games_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `players` (`player_id`) ON DELETE SET NULL,
  CONSTRAINT `games_ibfk_2` FOREIGN KEY (`player_turn`) REFERENCES `players` (`player_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `participants`
--

DROP TABLE IF EXISTS `participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participants` (
  `game_id` int NOT NULL,
  `player_id` int NOT NULL,
  `color` enum('blue','red','green','magenta') NOT NULL,
  `score` int DEFAULT '0',
  `is_ready` tinyint(1) NOT NULL DEFAULT '0',
  `last_action_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`game_id`,`player_id`),
  KEY `player_id` (`player_id`),
  CONSTRAINT `participants_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE,
  CONSTRAINT `participants_ibfk_2` FOREIGN KEY (`player_id`) REFERENCES `players` (`player_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `placed_tiles`
--

DROP TABLE IF EXISTS `placed_tiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `placed_tiles` (
  `tile_id` int NOT NULL,
  `game_id` int NOT NULL,
  `player_id` int NOT NULL,
  `anchor_x` int NOT NULL,
  `anchor_y` int NOT NULL,
  `mirror` tinyint(1) NOT NULL,
  `rotate` enum('0','90','180','270') NOT NULL DEFAULT '0',
  PRIMARY KEY (`tile_id`,`game_id`,`player_id`),
  KEY `game_id` (`game_id`),
  KEY `player_id` (`player_id`),
  CONSTRAINT `placed_tiles_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE,
  CONSTRAINT `placed_tiles_ibfk_2` FOREIGN KEY (`player_id`) REFERENCES `players` (`player_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `players` (
  `player_id` int NOT NULL AUTO_INCREMENT,
  `player_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`player_id`),
  UNIQUE KEY `player_name` (`player_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-28 17:02:01
