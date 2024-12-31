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
-- Dumping routines for database 'blokus_game'
--
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `createGameAndJoin`(
    IN creator_id INT,
    IN max_players ENUM('2', '4'),
    OUT new_game_id INT
)
BEGIN
    DECLARE available_color ENUM('blue', 'red', 'green', 'magenta');

    -- Ensure the player is not already in a game
    IF EXISTS (
        SELECT 1
        FROM participants p
        JOIN games g ON p.game_id = g.game_id
        WHERE p.player_id = creator_id AND g.status IN ('initialized', 'started')
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Player is already in a game.';
    END IF;

    -- Start a transaction
    START TRANSACTION;

    -- Create a new game
    INSERT INTO games (created_by, max_number_of_players)
    VALUES (creator_id, max_players);

    SET new_game_id = LAST_INSERT_ID();

    -- Assign the first available color
    SET available_color = 'blue';

    -- Add the creator to participants
    INSERT INTO participants (game_id, player_id, color)
    VALUES (new_game_id, creator_id, available_color);

    -- Commit the transaction
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `joinGame`(
	IN gameId INT,
    IN playerId INT
)
BEGIN
    DECLARE available_color ENUM('blue', 'red', 'green', 'magenta');
    DECLARE current_players INT;

    -- Start transaction
    START TRANSACTION;

    -- Check if the player is already in a game
    IF EXISTS (
        SELECT 2 FROM participants WHERE player_id = playerId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Player is already participating in another game';
    END IF;

    -- Check if the game is full
    SELECT COUNT(*) INTO current_players
    FROM participants
    WHERE game_id = gameId;

    SELECT max_number_of_players
    FROM games
    WHERE game_id = gameId
    INTO @max_players;

    IF current_players >= CAST(@max_players AS UNSIGNED) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'The game is full';
    END IF;

    -- Find the first available color
    SELECT color
    INTO available_color
    FROM (SELECT 'blue' AS color
          UNION SELECT 'red'
          UNION SELECT 'green'
          UNION SELECT 'magenta') AS all_colors
    WHERE color NOT IN (
        SELECT color FROM participants WHERE game_id = gameId
    )
    LIMIT 1;

    -- If no colors are available, raise an error
    IF available_color IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No available colors for the game';
    END IF;

    -- Insert the participant
    INSERT INTO participants (game_id, player_id, color)
    VALUES (gameId, playerId, available_color);

    -- Commit transaction
    COMMIT;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `removeParticipant`(
    IN playerId INT
)
BEGIN
    DECLARE gameId INT;
    DECLARE isCreator BOOLEAN;
    DECLARE gameState ENUM('not_active', 'initialized', 'started', 'ended', 'aborted');

    START TRANSACTION;

    -- Find the game ID, state, and whether the player is the creator
    SELECT g.game_id,
           g.status,
           (g.created_by = playerId) AS isCreator
    INTO gameId, gameState, isCreator
    FROM games g
    WHERE g.game_id IN (
        SELECT game_id
        FROM participants p
        WHERE p.player_id = playerId
    ) AND g.status IN ('initialized', 'started')
        LIMIT 1;

    -- If no active game is found, raise an error
    IF gameId IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Player is not a participant in any active game';
    END IF;

        -- Check if the game state allows the player to leave
        IF gameState NOT IN ('initialized', 'started') THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot leave a game that is not initialized or started';
END IF;

    -- If the player is the creator, delete the game and cascade
    IF isCreator THEN
        DELETE FROM games g WHERE g.game_id = gameId;
    ELSE
        -- Otherwise, remove them from the participants table
        DELETE FROM participants p WHERE p.game_id = gameId AND p.player_id = playerId;
    END IF;

    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- “unhandled user-defined exception.”
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `updateGameStatus`(
    IN gameId INT,
    IN newStatus VARCHAR(20)
)
BEGIN
  IF NOT EXISTS (
	SELECT 1 FROM games g WHERE  g.game_id = gameId
   ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game id does not exist.';
    END IF;
   IF (newStatus NOT IN ('ended', 'aborted') 
	) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Status data field must be either "ended" or "aborted".';
    END IF;
  IF NOT EXISTS (
         SELECT * 
         FROM  games g
         WHERE g.game_id = gameId AND g.status IN ('initialized', 'started')
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Game has already ended or aborted.';
    END IF;
    
    START TRANSACTION;
    
    UPDATE games g
    SET g.status = newStatus
    WHERE g.game_id = gameId;
    
    COMMIT;
    END ;;
    DELIMITER ;
